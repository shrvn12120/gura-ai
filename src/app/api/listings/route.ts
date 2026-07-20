import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";
import { openai } from "@/lib/openai";
import { revalidatePath } from "next/cache";


function buildText(data: any) {
  return `
Title: ${data.title}
Category: ${data.category}
SubCategory: ${data.subCategory}
Description: ${data.description}
Metadata: ${JSON.stringify(data.metadata)}
`;
}

export async function GET(req: NextRequest) {

  try {
    await connectDB();

    // 1. Extract the 'name' parameter from the query string (e.g., /api/data?name=john)
    const { searchParams } = await req.nextUrl;


    // 1. Initialize an empty query object
    const mongoQuery: Record<string, any> = {};

    // 2. Loop through all incoming query parameters dynamically
    searchParams.forEach((value, key) => {
      // Skip empty values
      if (!value) return; 

      // If the field is a string, make it a case-insensitive regex search
      // Example: ?title=apartment -> { title: /apartment/i }
      mongoQuery[key] = { $regex: new RegExp(value, 'i') };
    });

    // 3. Fallback: If no query parameters were provided, handle it
    // (Optional: remove this if you want to allow fetching everything when empty)
    if (Object.keys(mongoQuery).length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one search parameter is required' },
        { status: 400 }
      );
    }
    mongoQuery.active = true;

    // 3. Query the database using a case-insensitive regex match
    //    Example: 'john' will match 'John', 'JOHN', or 'john'
    const data = await Listing.find(mongoQuery)
      .lean()
      .select({
        title: 1,
        description: 1,
        contact_info: 1,
        images: 1,
        metadata: 1,
        _id: 0
      });
(await connectDB()).close()
    // 4. Return the results
    return NextResponse.json(
      { success: true, data },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Database query error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while searching the database.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
  
}

export async function POST(req: NextRequest) {
  await connectDB();

  const body = await req.json();

  const searchableText = buildText(body);

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: searchableText,
  });

  const doc = await Listing.create({
    ...body,
    searchableText,
    embedding: embedding.data[0].embedding,
  });

(await connectDB()).close()
  revalidatePath("/admin/listings")
  return Response.json(doc);
}
