import { NextRequest } from "next/server";
import  connectDB  from "@/lib/mongodb";
import Listing from "@/models/Listing";
import { openai } from "@/lib/openai";

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

  return Response.json(doc);
}