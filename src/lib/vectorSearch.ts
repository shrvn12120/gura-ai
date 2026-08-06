import OpenAI from "openai";
import { formatListings } from "./list-format";
import { db } from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function vectorSearch(
  query: string,
  limit = 4
) {

  const normalizedQuery = query
    .trim()
    .toLowerCase();

  let queryVector: string;

  // -------------------------
  // Check cache
  // -------------------------

  const cached = await db.query(
    `
    SELECT embedding
    FROM query_embeddings
    WHERE query = $1
    `,
    [normalizedQuery]
  );

  if (cached.rows.length > 0) {


    queryVector = cached.rows[0].embedding;

     db.query(
      `
      UPDATE query_embeddings
      SET
        hits = hits + 1,
        last_used_at = NOW()
      WHERE query = $1
      `,
      [normalizedQuery]
    );

  } else {



    const embeddingResponse =
      await openai.embeddings.create({

        model: "text-embedding-3-small",

        input: normalizedQuery,

      });

    queryVector =
      `[${embeddingResponse.data[0].embedding.join(",")}]`;

    await db.query(
      `
      INSERT INTO query_embeddings
      (
        query,
        embedding
      )
      VALUES
      (
        $1,
        $2::vector
      )
      `,
      [
        normalizedQuery,
        queryVector,
      ]
    );

  }

  // -------------------------
  // Vector Search
  // -------------------------

  const results = await db.query(
    `
    SELECT

      id,

      title,

      category,

      subcategory AS "subCategory",

      description,

      contact_info,

      metadata,

      images,

      embedding <=> $1::vector AS distance

    FROM listings

    WHERE active = true

    ORDER BY embedding <=> $1::vector

    LIMIT $2
    `,
    [
      queryVector,
      limit,
    ]
  );

  return formatListings(results.rows);

}