import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";


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


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
      INSERT INTO listings
      (
        title,
        slug,
        category,
        subcategory,
        description,
        contact_info,
        images,
        metadata,
        active,
        searchable_text,
        embedding,
        public_access,
        public_password_hash
      )

      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11::vector,
        $12,
        $13
      )

      RETURNING *;
      `,
      [
        body.title,
        body.slug,
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
        publicPasswordHash?? null,
      ]
    );



    revalidatePath("/admin/listings");

    return NextResponse.json(result.rows[0]);

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}