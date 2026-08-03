// import OpenAI from "openai";
// import Listing from "@/models/Listing";
// import connectDB from "./mongodb";
// import { formatListings } from "./list-format";


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });


// export async function vectorSearch(
//   query:string,
//   limit=10
// ){

//   await connectDB();



//   const embedding =
//     await openai.embeddings.create({

//       model:"text-embedding-3-small",

//       input:query

//     });



//   const queryVector =
//     embedding.data[0].embedding;




//   const results =
//     await Listing.aggregate(
//       [
//         {
//           $vectorSearch: {
//             index: "vector_index",
//             path: "embedding",
//             queryVector: queryVector,
//             numCandidates: 100,
//             limit: 4, // Tightened limit preserves model focus and reduces token cost
//             filter: {
//               active: true,
//             },
//           },
//         },
//         {
//           $project: {
//             title: 1,
//             category: 1,
//             subCategory: 1,
//             description: 1,
//             contact_info: 1,
//             metadata: 1,
//             images: 1,
//           },
//         },
//       ]
//     );

// (await connectDB()).close()
//       return formatListings(results);


// }

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

    console.log("✅ Query embedding cache hit");

    queryVector = cached.rows[0].embedding;

    await db.query(
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

    console.log("⚡ Creating new embedding");

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