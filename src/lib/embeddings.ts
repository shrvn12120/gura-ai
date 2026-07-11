import { openai } from "./openai";

export function createSearchableText(listing: any) {
  return `
Title: ${listing.title}

Category: ${listing.category}

Island: ${listing.island}

Description:
${listing.description}

Price:
${listing.price}

Metadata:
${JSON.stringify(listing.metadata)}
`;
}

export async function createEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}