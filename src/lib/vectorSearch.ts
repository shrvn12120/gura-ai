import OpenAI from "openai";
import Listing from "@/models/Listing";
import connectDB from "./mongodb";
import { formatListings } from "./list-format";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});


export async function vectorSearch(
  query:string,
  limit=10
){

  await connectDB();



  const embedding =
    await openai.embeddings.create({

      model:"text-embedding-3-small",

      input:query

    });



  const queryVector =
    embedding.data[0].embedding;




  const results =
    await Listing.aggregate(
      [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryVector,
            numCandidates: 100,
            limit: 4, // Tightened limit preserves model focus and reduces token cost
            filter: {
              active: true,
            },
          },
        },
        {
          $project: {
            title: 1,
            category: 1,
            subCategory: 1,
            description: 1,
            contact_info: 1,
            metadata: 1,
            images: 1,
          },
        },
      ]
    );

(await connectDB()).close()
      return formatListings(results);


}