// import { NextRequest } from "next/server";
// import connectDB from "@/lib/mongodb";
// import Listing from "@/models/Listing";
// import { openai } from "@/lib/openai";
// import { revalidatePath } from "next/cache";

// function buildText(data: any) {
//   return `
// Title: ${data.title}
// Category: ${data.category}
// Description: ${data.description}
// Metadata: ${JSON.stringify(data.metadata)}
// `;
// }

// interface RouteParams {
//   params: Promise<{ id: string }>;
// }

// export async function PUT(req: NextRequest, { params }: RouteParams) {
//   try {
//     await connectDB();

//     // 1. Resolve dynamic ID params cleanly
//     const { id } = await params;
//     const body = await req.json();

//     // 2. Safeguard: Prevent accidental MongoDB ID modifications or slug changes
//     delete body._id;
//     delete body.slug; 

//     // 3. Compile a fresh vector-ready copy of the updated text blocks
//     const searchableText = buildText(body);

//     // 4. Update vector embeddings to keep search parameters precise
//     const embeddingResponse = await openai.embeddings.create({
//       model: "text-embedding-3-small",
//       input: searchableText,
//     });

//     const embedding = embeddingResponse.data[0].embedding;

//     // 5. Commit updates safely to MongoDB, returning the updated document
//     const updatedDoc = await Listing.findByIdAndUpdate(
//       id,
//       {
//         ...body,
//         searchableText,
//         embedding,
//       },
//       { 
//         new: true, // Returns the freshly updated entry instead of the older source state
//         runValidators: true // Enforces Mongoose schema validation constraints on updates
//       }
//     );

//     if (!updatedDoc) {
//       return Response.json({ error: "Listing target document not found" }, { status: 404 });
//     }
//       revalidatePath("/admin/listings", "layout")

//     return Response.json(updatedDoc, { status: 200 });

//   } catch (error: any) {
//     console.error("PUT Request Failure:", error);
//     return Response.json(
//       { error: error.message || "An unexpected system fault occurred while altering database entries" }, 
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { openai } from "@/lib/openai";
import { db } from "@/lib/db";


function buildText(data: any) {
  return `
Title: ${data.title}
Category: ${data.category}
Description: ${data.description}
Metadata: ${JSON.stringify(data.metadata)}
`;
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

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: searchableText,
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
        updated_at = NOW()

      WHERE id = $11

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