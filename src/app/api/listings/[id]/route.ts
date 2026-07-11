import { NextRequest } from "next/server";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";
import { openai } from "@/lib/openai";

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

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await connectDB();

    // 1. Resolve dynamic ID params cleanly
    const { id } = await params;
    const body = await req.json();

    // 2. Safeguard: Prevent accidental MongoDB ID modifications or slug changes
    delete body._id;
    delete body.slug; 

    // 3. Compile a fresh vector-ready copy of the updated text blocks
    const searchableText = buildText(body);

    // 4. Update vector embeddings to keep search parameters precise
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: searchableText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 5. Commit updates safely to MongoDB, returning the updated document
    const updatedDoc = await Listing.findByIdAndUpdate(
      id,
      {
        ...body,
        searchableText,
        embedding,
      },
      { 
        new: true, // Returns the freshly updated entry instead of the older source state
        runValidators: true // Enforces Mongoose schema validation constraints on updates
      }
    );

    if (!updatedDoc) {
      return Response.json({ error: "Listing target document not found" }, { status: 404 });
    }

    return Response.json(updatedDoc, { status: 200 });

  } catch (error: any) {
    console.error("PUT Request Failure:", error);
    return Response.json(
      { error: error.message || "An unexpected system fault occurred while altering database entries" }, 
      { status: 500 }
    );
  }
}