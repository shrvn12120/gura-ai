import { NextRequest } from "next/server";
import connectDB  from "@/lib/mongodb";
import Knowledge from "@/models/Knowledge";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  await connectDB();

  const body = await req.json();

  const searchableText = `${body.title}\n${body.content}`;

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: searchableText,
  });

  const doc = await Knowledge.create({
    ...body,
    searchableText,
    embedding: embedding.data[0].embedding,
  });

  return Response.json(doc);
}