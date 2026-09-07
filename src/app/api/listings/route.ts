import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function buildText(data: any) {
  return `
Title: ${data.title}
Category: ${data.category}
SubCategory: ${data.subCategory}
Description: ${data.description}
Metadata: ${JSON.stringify(data.metadata)}
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const searchableText = buildText(body);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: searchableText,
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
        embedding
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
        $11::vector
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