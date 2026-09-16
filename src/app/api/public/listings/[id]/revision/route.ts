import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PublicRevisionBody {
  description?: string;
  contact_info?: {
    address?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    socials?: {
      name: string;
      link: string;
    }[];
    coordinates?: {
      lat: string;
      lng: string;
    };
  };
  images?: {
    id: string;
    url: string;
    alt: string;
  }[];
  metadata?: Record<string, unknown>;
  active?: boolean;
}

/**
 * Replace this with your existing authentication/session lookup.
 *
 * The important part is that this MUST return the authenticated
 * public manager's user ID and must NOT trust a user ID from the request.
 */
async function getPublicUserId(): Promise<string | null> {
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const userId = await getPublicUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const listingResult = await db.query(
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
        active
      FROM listings
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const assignmentResult = await db.query(
      `
      SELECT 1
      FROM listing_assignments
      WHERE listing_id = $1
        AND user_id = $2
      LIMIT 1
      `,
      [id, userId]
    );

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "You are not responsible for this listing" },
        { status: 403 }
      );
    }

    const revisionResult = await db.query(
      `
      SELECT
        id,
        description,
        contact_info,
        images,
        metadata,
        active,
        status,
        rejection_reason,
        created_at,
        updated_at
      FROM listing_revisions
      WHERE listing_id = $1
        AND status IN ('draft', 'pending_review')
      LIMIT 1
      `,
      [id]
    );

    return NextResponse.json({
      listing: listingResult.rows[0],
      revision: revisionResult.rows[0] ?? null,
    });
  } catch (error) {
    console.error("GET public revision error:", error);

    return NextResponse.json(
      { error: "Failed to load listing revision" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const userId = await getPublicUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const assignmentResult = await db.query(
      `
      SELECT 1
      FROM listing_assignments
      WHERE listing_id = $1
        AND user_id = $2
      LIMIT 1
      `,
      [id, userId]
    );

    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "You are not responsible for this listing" },
        { status: 403 }
      );
    }

    const listingResult = await db.query(
      `
      SELECT id
      FROM listings
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (listingResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    const body = (await req.json()) as PublicRevisionBody;

    const description =
      typeof body.description === "string"
        ? body.description
        : "";

    const contactInfo =
      body.contact_info &&
      typeof body.contact_info === "object"
        ? body.contact_info
        : {};

    const images =
      Array.isArray(body.images)
        ? body.images
        : [];

    const metadata =
      body.metadata &&
      typeof body.metadata === "object"
        ? body.metadata
        : {};

    const active =
      typeof body.active === "boolean"
        ? body.active
        : false;

    const result = await db.query(
      `
      INSERT INTO listing_revisions (
        listing_id,
        description,
        contact_info,
        images,
        metadata,
        active,
        status,
        submitted_by
      )
      VALUES (
        $1,
        $2,
        $3::jsonb,
        $4::jsonb,
        $5::jsonb,
        $6,
        'draft',
        $7
      )
      ON CONFLICT (listing_id)
      WHERE status IN ('draft', 'pending_review')
      DO UPDATE SET
        description = EXCLUDED.description,
        contact_info = EXCLUDED.contact_info,
        images = EXCLUDED.images,
        metadata = EXCLUDED.metadata,
        active = EXCLUDED.active,
        updated_at = NOW()
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
        created_at,
        updated_at
      `,
      [
        id,
        description,
        JSON.stringify(contactInfo),
        JSON.stringify(images),
        JSON.stringify(metadata),
        active,
        userId,
      ]
    );

    return NextResponse.json({
      success: true,
      revision: result.rows[0],
    });
  } catch (error) {
    console.error("PUT public revision error:", error);

    return NextResponse.json(
      { error: "Failed to save revision" },
      { status: 500 }
    );
  }
}