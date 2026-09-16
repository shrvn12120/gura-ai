import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const ACCESS_COOKIE_PREFIX = "listing_public_";
const ACCESS_MAX_AGE = 60 * 60 * 24; // 24 hours

// Convert secret string to Uint8Array for jose
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_change_in_production"
);

function cookieName(id: string) {
  return `${ACCESS_COOKIE_PREFIX}${id}`;
}

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

async function getListing(id: string) {
  const result = await db.query(
    `
      SELECT
        id,
        title,
        slug,
        category,
        subcategory,
        description,
        contact_info,
        images,
        metadata,
        active,
        public_access,
        public_password_hash
      FROM listings
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

/**
 * Verify authentication token against route params
 */
async function authorizeRequest(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName(id))?.value;

  if (!token) {
    return { authorized: false, status: 401, error: "Access required" };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.listingId !== id) {
      return { authorized: false, status: 403, error: "Unauthorized for this listing" };
    }

    return { authorized: true };
  } catch {
    return { authorized: false, status: 401, error: "Access expired or invalid token" };
  }
}

/**
 * POST: Verify password and issue JWT cookie
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const password = body?.password;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    const listing = await getListing(id);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    if (!listing.public_access) {
      return NextResponse.json(
        { error: "Public access is not enabled" },
        { status: 403 },
      );
    }

    if (!listing.public_password_hash) {
      return NextResponse.json(
        { error: "Public access password is not configured" },
        { status: 403 },
      );
    }

    const passwordHash = hashPassword(password);
    const valid = safeCompare(passwordHash, listing.public_password_hash);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 },
      );
    }

    // Generate signed JWT token containing listing claims
    const token = await new SignJWT({ listingId: id, access: "public_edit" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_MAX_AGE}s`)
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: cookieName(id),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ACCESS_MAX_AGE,
      path: "/", // Scoped to root so pages & API calls can both access it easily
    });

    return response;
  } catch (error) {
    console.error("Public listing access error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET: Validate JWT cookie and return authorized data along with latest draft
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const listing = await getListing(id);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    if (!listing.public_access) {
      return NextResponse.json(
        { error: "Public access is not enabled" },
        { status: 403 },
      );
    }

    const auth = await authorizeRequest(id);
    if (!auth.authorized) {
      return NextResponse.json(
        { authenticated: false, error: auth.error },
        { status: auth.status },
      );
    }

    // Fetch latest draft if available
    const draftResult = await db.query(
      `
        SELECT
          id,
          description,
          contact_info,
          images,
          metadata,
          active,
          status,
          rejection_reason
        FROM listing_revisions
        WHERE listing_id = $1
        LIMIT 1
      `,
      [id]
    );

    const draft = draftResult.rows[0] ?? null;
    return NextResponse.json({
      authenticated: true,
      listing: {
        id: listing.id,
        title: listing.title,
        slug: listing.slug,
        category: listing.category,
        subcategory: listing.subcategory,
        description: listing.description,
        contact_info: listing.contact_info,
        images: listing.images,
        metadata: listing.metadata,
        active: listing.active,
        public_access: listing.public_access,
      },
      draft,
    });
  } catch (error) {
    console.error("Get public listing error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT: Save or update draft changes for a public listing
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const listing = await getListing(id);
    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 },
      );
    }

    if (!listing.public_access) {
      return NextResponse.json(
        { error: "Public access is not enabled" },
        { status: 403 },
      );
    }

    const auth = await authorizeRequest(id);
    if (!auth.authorized) {
      return NextResponse.json(
        { authenticated: false, error: auth.error },
        { status: auth.status },
      );
    }

    const body = await request.json();
    const { description, contact_info, images, metadata, active, mode } = body;

    if (mode !== "draft" && mode !== "review") {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'draft' or 'review'." },
        { status: 400 },
      );
    }

    const tableName = mode === "draft" ? "listing_drafts" : "listing_revisions";
    
    // Status mapped directly to match DB constraints
    // listing_drafts uses 'pending', listing_revisions uses 'pending_review'
    const status = mode === "draft" ? "pending" : "pending_review";

    const existingRecord = await db.query(
      `SELECT id FROM ${tableName} WHERE listing_id = $1 LIMIT 1`,
      [id]
    );

    const values = [
      id,
      description ?? listing.description,
      JSON.stringify(contact_info ?? listing.contact_info),
      JSON.stringify(images ?? listing.images),
      JSON.stringify(metadata ?? listing.metadata),
      active ?? listing.active,
      status,
    ];

    let result;

    if (existingRecord.rows.length > 0) {
      result = await db.query(
        `
          UPDATE ${tableName}
          SET
            description = $2,
            contact_info = $3,
            images = $4,
            metadata = $5,
            active = $6,
            status = $7,
            submitted_at = NOW()
          WHERE listing_id = $1
          RETURNING
            id,
            listing_id,
            description,
            contact_info,
            images,
            metadata,
            active,
            status,
            submitted_by,
            submitted_at,
            reviewed_by,
            reviewed_at,
            rejection_reason,
            created_at
        `,
        values
      );
    } else {
      result = await db.query(
        `
          INSERT INTO ${tableName} (
            listing_id,
            description,
            contact_info,
            images,
            metadata,
            active,
            status,
            submitted_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING
            id,
            listing_id,
            description,
            contact_info,
            images,
            metadata,
            active,
            status,
            submitted_by,
            submitted_at,
            reviewed_by,
            reviewed_at,
            rejection_reason,
            created_at
        `,
        values
      );
    }

    return NextResponse.json({
      success: true,
      mode,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Save draft/revision error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}