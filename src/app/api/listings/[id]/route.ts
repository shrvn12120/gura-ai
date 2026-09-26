import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, updateTag } from "next/cache";
import { openai } from "@/lib/openai";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";


function buildText(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (data.title) parts.push(`Title: ${data.title}`);
  if (data.category) parts.push(`Category: ${data.category}`);
  if (data.description) parts.push(`Description: ${data.description}`);
  if (data.metadata && Object.keys(data.metadata).length > 0) {
    parts.push(`Metadata: ${JSON.stringify(data.metadata)}`);
  }

  return parts.join("\n").trim();
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const body = await req.json();

    // Keep slug immutable
    delete body.slug;
    delete body.id;
    delete body.mongo_id;

    const searchableText = buildText(body);

        let publicPasswordHash: string | null = null;
    
    
        if (body.public_access && body.publicPassword) {
            publicPasswordHash = await bcrypt.hash(body.publicPassword, 12);
        }
        if (!body.public_access) {
        publicPasswordHash = null;
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: searchableText,
      dimensions: 512,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const result = await db.query(
      `
      UPDATE listings
      SET
        title = $1,
        category = $2,
        subcategory = $3,
        description = $4,
        contact_info = $5,
        images = $6,
        metadata = $7,
        active = $8,
        searchable_text = $9,
        embedding = $10::vector,
        public_access = $11,
        public_password_hash = $12,
        updated_at = NOW()

      WHERE id = $13

      RETURNING *;
      `,
      [
        body.title,
        body.category,
        body.subCategory ?? "default",
        body.description ?? "",

        JSON.stringify(body.contact_info ?? {}),

        JSON.stringify(body.images ?? []),

        JSON.stringify(body.metadata ?? {}),

        body.active ?? false,

        searchableText,

        `[${embedding.join(",")}]`,

        body.public_access ?? false,
        publicPasswordHash ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: "Listing not found",
        },
        {
          status: 404,
        }
      );
    }

    revalidatePath("/admin/listings", "layout");

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}