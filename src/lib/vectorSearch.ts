import OpenAI from "openai";
import { db } from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const EMBEDDING_MODEL = "text-embedding-3-small";

function normalizeQuery(query: string) {
  return query
    .trim()
    .toLowerCase()
    .replace(/[?!.。,]+$/g, "")
    .replace(/\s+/g, " ");
}

export type VectorSearchResult = {
  id: string;
  title: string;
  category: string | null;
  subCategory: string | null;
  description: string | null;
  contactInfo: unknown;
  metadata: unknown;
  images: unknown;
  distance: number;
};

export async function vectorSearch(
  query: string,
  limit = 4,
): Promise<VectorSearchResult[]> {
  const normalizedQuery =
    normalizeQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  let queryVector: string;

  /*
   * --------------------------------------------------
   * 1. EMBEDDING CACHE
   * --------------------------------------------------
   */

  const cached = await db.query(
    `
    SELECT embedding
    FROM query_embeddings
    WHERE query = $1
    LIMIT 1
    `,
    [normalizedQuery],
  );
  /*
   * --------------------------------------------------
   * 2. CACHE HIT
   * --------------------------------------------------
   */

  if (cached.rows.length > 0) {
    queryVector =
      cached.rows[0].embedding;

    /*
     * Analytics only.
     *
     * Don't make the user wait for this.
     */
    void db.query(
      `
      UPDATE query_embeddings
      SET
        hits = hits + 1,
        last_used_at = NOW()
      WHERE query = $1
      `,
      [normalizedQuery],
    );
  }

  /*
   * --------------------------------------------------
   * 3. CACHE MISS
   * --------------------------------------------------
   */

  else {
    const embeddingResponse =
      await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: normalizedQuery,
      });

    queryVector =
      `[${embeddingResponse.data[0].embedding.join(",")}]`;

    await db.query(
      `
      INSERT INTO query_embeddings (
        query,
        embedding,
        hits,
        last_used_at
      )
      VALUES (
        $1,
        $2::vector,
        0,
        NOW()
      )
      ON CONFLICT (query)
      DO UPDATE SET
        embedding = EXCLUDED.embedding,
        last_used_at = NOW()
      `,
      [
        normalizedQuery,
        queryVector,
      ],
    );
  }

  /*
   * --------------------------------------------------
   * 4. PGVECTOR SEARCH
   * --------------------------------------------------
   */

  const results = await db.query(
    `
    SELECT
      id,
      title,
      category,
      subcategory AS "subCategory",
      description,
      contact_info AS "contactInfo",
      metadata,
      images,

      embedding <=> $1::vector AS distance

    FROM listings

    WHERE active = true
      AND embedding IS NOT NULL

    ORDER BY embedding <=> $1::vector

    LIMIT $2
    `,
    [
      queryVector,
      limit,
    ],
  );

  /*
   * --------------------------------------------------
   * 5. RETURN STRUCTURED DATA
   * --------------------------------------------------
   *
   * Don't use formatListings() here.
   *
   * The AI tool needs structured data.
   */

  return results.rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    subCategory: row.category,
    description: row.description,
    contactInfo: row.contactInfo,
    metadata: row.metadata,
    images: row.images,
    distance: Number(row.distance),
  }));
}