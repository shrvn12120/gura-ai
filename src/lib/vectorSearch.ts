"use server";

import OpenAI from "openai";
import { db } from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 10;
const MEMORY_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_MEMORY_CACHE_SIZE = 1000;

export type VectorSearchResult = {
  id: string;
  title: string | null;
  category: string | null;
  subCategory: string | null;
  description: string | null;
  contactInfo: unknown;
  metadata: unknown;
  images: unknown;
  distance: number;
};

// Simple bounded in-memory cache
const memoryCache = new Map<
  string,
  { expiresAt: number; results: VectorSearchResult[] }
>();

function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[?!.。,]+$/g, "")
    .replace(/\s+/g, " ");
}

function parseEmbedding(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return `[${value.join(",")}]`;
  throw new Error("Invalid embedding structure retrieved from database.");
}

function mapSearchResults(
  rows: Array<Record<string, unknown>>,
): VectorSearchResult[] {
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    title: typeof row.title === "string" ? row.title : null,
    category: typeof row.category === "string" ? row.category : null,
    subCategory: typeof row.subCategory === "string" ? row.subCategory : null,
    description: typeof row.description === "string" ? row.description : null,
    contactInfo: row.contactInfo,
    metadata: row.metadata,
    images: row.images,
    distance: Number(row.distance ?? 0),
  }));
}

function getFromMemoryCache(query: string, limit: number): VectorSearchResult[] | null {
  const cacheKey = `${query}:${limit}`;
  const entry = memoryCache.get(cacheKey);

  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(cacheKey);
    return null;
  }

  return entry.results;
}

function setToMemoryCache(query: string, limit: number, results: VectorSearchResult[]): void {
  // Evict oldest entries if capacity reached
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }

  const cacheKey = `${query}:${limit}`;
  memoryCache.set(cacheKey, {
    expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
    results,
  });
}

function incrementEmbeddingAnalytics(query: string): void {
  db.query(
    `
    UPDATE query_embeddings
    SET
      hits = hits + 1,
      last_used_at = NOW()
    WHERE query = $1
    `,
    [query],
  ).catch((error) => {
    console.error("⚠️ Failed to update embedding analytics:", error);
  });
}

export async function vectorSearch(
  query: string,
  limit = DEFAULT_LIMIT,
): Promise<VectorSearchResult[]> {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return [];

  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);

  // 1. Check process memory cache
  const cachedMemory = getFromMemoryCache(normalizedQuery, safeLimit);
  if (cachedMemory) return cachedMemory;

  let queryVector: string;

  // 2. Query persistent embedding cache
  const embeddingCache = await db.query(
    `
    SELECT embedding
    FROM query_embeddings
    WHERE query = $1
    LIMIT 1
    `,
    [normalizedQuery],
  );

  if (embeddingCache.rows.length > 0) {
    queryVector = parseEmbedding(embeddingCache.rows[0].embedding);
    incrementEmbeddingAnalytics(normalizedQuery);
  } else {
    // 3. Fallback to OpenAI API call
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: normalizedQuery,
      dimensions: 512,
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding) {
      throw new Error("OpenAI returned an empty embedding response.");
    }

    queryVector = `[${embedding.join(",")}]`;

    // Persist new vector
    await db.query(
      `
      INSERT INTO query_embeddings (query, embedding, hits, last_used_at)
      VALUES ($1, $2::vector, 1, NOW())
      ON CONFLICT (query)
      DO UPDATE SET last_used_at = NOW()
      `,
      [normalizedQuery, queryVector],
    );
  }

  // 4. Perform vector similarity search against active listings
  const dbResults = await db.query(
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
    ORDER BY distance
    LIMIT $2
    `,
    [queryVector, safeLimit],
  );

  const structuredResults = mapSearchResults(dbResults.rows);

  // Store in memory cache
  setToMemoryCache(normalizedQuery, safeLimit, structuredResults);

  return structuredResults;
}