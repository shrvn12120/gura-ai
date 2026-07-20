"use server";

import { MetaConfig } from "@/components/admin/meta-config/types";
// import { CATEGORY_SUBCATEGORY_META_CONFIGS } from "@/lib/categories.config";
// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const categoryText = Object.entries(CATEGORY_SUBCATEGORY_META_CONFIGS)
//   .map(([category, subCategories]) => {
//     const subs = Object.keys(subCategories)
//       .filter((sub) => sub !== "default")
//       .map((sub) => `  ${sub}`)
//       .join("\n");

//     return `${category}:\n${subs}`;
//   })
//   .join("\n\n");

// const classifierPrompt = `
// You are an intent classifier for a single island Maldives travel assistant.

// Analyze the user's message and return ONLY valid JSON.

// You must choose exactly one:
// * Tax/buugy/golf cart is { category: 'transport', subCategory: 'in-land' }.

// 1. aboutIsland
// - true when the user asks general information about the island.
// - list and more must be null.

// 2. list
// - use when user wants recommendations, suggestions, or semantic discovery.
// - Examples:
//   "Recommend guest houses"
//   "Best restaurants"
//   "Where should I stay?"
// - more must be null.

// 3. more
// - use when user wants a complete listing, any type of all.
// - Examples:
//   "Show all restaurants"
//   "List all guest houses"
//   "Give list of all buggy phone number"
// - list must be null.

// 4. single
// - when user want single or a specefic type information.
// - Examples:
//   "where is A cafe"
//   "where is --certain-- type/place/activity"
//   "When a user asks to locate, guide them to, or find a specific place (e.g., 'where is H72', 'guide me to Rustic', 'find Amore/Bikini Beach')"
// - more must be null.

// Categories:
// ${
//   categoryText
// }
// -Make sure subCategorie is in correct category

// Return format:

// {
//   "list": {
//     "category": "",
//     "subCategory": ""
//   } | null,

//   "aboutIsland": boolean,

//   "more": {
//     "category": "",
//     "subCategory": ""
//   } | null

//   "single": {
//     "name": "in lowercase",
//   } | null
// }

// Rules:
// - If aboutIsland is true, list,more and single must be null.
// - Never return both list and more or more and single.
// - If unsure, return all null except aboutIsland false.
// - One intention is clear, dont change unless user get what he is tring.
// `;

// export type IntentClassification = {
//   list: {
//     category: string;
//     subCategory: string;
//   } | null;

//   aboutIsland: boolean;

//   more: {
//     category: string;
//     subCategory: string;
//   } | null;
//   single: {
//     name: string
//   } | null;
// };

// export async function classifyIntent(
//   message: string,
//   conversation: OpenAI.Chat.ChatCompletionMessageParam[]
// ): Promise<IntentClassification> {

//   try {
//     const response = await openai.responses.create({
//       model: "gpt-4.1-nano",

//       input: [
//         {
//           role: "system",
//           content: classifierPrompt,
//         },
//         {
//           role: "user",
//           content: message,
//         },
//       ],

//       text: {
//         format: {
//           type: "json_schema",
//           name: "intent_classifier",
//           strict: true,
//           schema: {
//             type: "object",
//             additionalProperties: false,

//             properties: {
//               list: {
//                 type: ["object", "null"],
//                 properties: {
//                   category: {
//                     type: "string",
//                   },
//                   subCategory: {
//                     type: "string",
//                   },
//                 },
//                 required: [
//                   "category",
//                   "subCategory",
//                 ],
//                 additionalProperties: false,
//               },

//               aboutIsland: {
//                 type: "boolean",
//               },

//               more: {
//                 type: ["object", "null"],
//                 properties: {
//                   category: {
//                     type: "string",
//                   },
//                   subCategory: {
//                     type: "string",
//                   },
//                 },
//                 required: [
//                   "category",
//                   "subCategory",
//                 ],
//                 additionalProperties: false,
//               },
//                single: {
//                 type: ["object", "null"],
//                 properties: {
//                      name: {
//                     type: "string",
//                   }
//                 },
//                 required: [
//                   "name"
//                 ],
//                 additionalProperties: false,
//               },
//             },

//             required: [
//               "list",
//               "aboutIsland",
//               "more",
//               "single"
//             ],
//           },
//         },
//       },
//     });

//     return JSON.parse(
//       response.output_text
//     ) as IntentClassification;

//   } catch (error) {
//     console.error(
//       "Intent classification error:",
//       error
//     );

//     return {
//       list: null,
//       aboutIsland: false,
//       more: null,
//       single: null
//     };
//   }
// }

import { CATEGORY_SUBCATEGORY_META_CONFIGS } from "@/lib/categories.config";
import { formatListing, formatListings } from "@/lib/list-format";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";
import metaConfig from "@/models/MetaConfig";
import { cacheLife, cacheTag } from "next/cache";
import OpenAI from "openai";


// --------------------- //

type RetrievalType =
  | "general"
  | "knowledge"
  | "single"
  | "category"
  | "semantic";

export type IntentClassification = {
  type: RetrievalType;
  name: string | null;
  category: string | null;
  subCategory: string | null;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --------------------------------------------- //

export async function getMetaConfigs(): Promise<MetaConfig[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/meta-configs`);


  if (!res.ok) {
    throw new Error(
      "Failed to fetch meta configs"
    );
  }


  return res.json();

}



export async function classifyIntent(
  message: string,
  conversation: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<IntentClassification> {

    const configs = await getMetaConfigs();
    const categoryText = configs.map((c)=>{
      const subs = c.subCategories.filter(((sub)=> sub.name !== "default"))
      .map((sub)=>{
        return sub.name
      }).join("\n");
    return `${c.category}:\n${subs}`;
    })
  .join("\n\n");


// const classifierPrompt = `
// You are an intent classifier for a single island Maldives travel assistant.
// Analyze the user's latest message considering the provided conversation history and return a structured JSON response.

// You must choose exactly one intent:
// * Tax/buggy/golf cart is { category: 'transport', subCategory: 'in-land' }.

// 1. aboutIsland
// - true when the user asks general information about the island.

// 2. list
// - use when user wants recommendations, suggestions, or semantic discovery.
// - Examples: "Recommend guest houses", "Best restaurants", "Where should I stay?", "i dont know where am stying"
// - If the user is finding unknown things/places/types.
// - If user is looking for a place near/next/infront of a certain near/next/infront

// 3. more
// - use when user wants a complete listing, any type of all.
// - Examples: "Show all restaurants", "List all guest houses", "Give list of all buggy phone number"

// 4. single
// - when user want a specific information.
// - Examples: "where is A cafe", "where is --certain-- type/place/activity", "When a user asks to locate, guide them to, or find a specific place (e.g., 'where is H72', 'guide me to Rustic', 'find Amore/Bikini Beach')"

// Categories:
// ${categoryText}
// - Make sure subCategory is in the correct category.

// Rules:
// - If aboutIsland is true; list, more, and single must be null.
// - Never return both list and more...., Only one structure can be active.
// - If unsure, return all null except aboutIsland false.
// - Keep the user's true intent stable across turns unless they explicitly change what they are trying to do.
//   Examples:
//   user: "whats the nearest A to B",
//   assistant: "The nearest A to B is C",
//   user: "can i get phone number?" => your smart to know its C user is refering.

// `;
const classifierPrompt = `
You are an intent classifier for Explore Guraidhoo AI assistant.

Your job is ONLY to classify the user's request.

Do not answer the user.

Return JSON only.


Available intent types:


1. general

Questions that can be answered without local database.

Examples:

- What currency does Maldives use?
- What language is spoken?
- What should I pack?
- Best time to visit Maldives?
- Is Maldives safe?


2. knowledge

Questions about Guraidhoo island information.

Examples:

- Where is Guraidhoo?
- How big is Guraidhoo?
- Population of Guraidhoo?
- Ferry information?


3. single

User asks about a specific business/place/listing.

Examples:

- Tell me about Amore Cafe
- Does Arena Beach have WiFi?
- Show me photos of a guesthouse


Requires:
name


4. category

User wants a list of businesses.
Categories:
${categoryText}
- Make sure subCategory is in the correct category.

Examples:

- Restaurants in Guraidhoo
- Guesthouses
- Diving centers


Requires:
category


5. semantic

User describes something but does not mention a specific business.

Examples:

- Romantic place for dinner
- Cheap accommodation
- Best sunset spot
- Family friendly activities


Requires vector search.



Return format:


{
"type":"general",
"name":null,
"category":null,
"subCategory: "null"
}


Rules:

- If a specific business name exists, choose "single".
- If user wants multiple options, choose "category".
- If the request needs business data but cannot be solved by category filtering, choose "semantic".
- Never choose semantic for general questions.
- Keep names exactly as user wrote them.
`;


  try {
    // 1. Build the complete message history with the classification system instructions first
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: classifierPrompt,
      },
      ...conversation, // Spreads previous back-and-forth turns
      {
        role: "user",
        content: message, // Appends the latest message to classify
      },
    ];

    // 2. Execute the completion using strict JSON schema validation
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Standard chat completion models work best with conversation parameters
      messages: messages,
      // response_format: {
      //   type: "json_schema",
      //   json_schema: {
      //     name: "intent_classifier",
      //     strict: true,
      //     schema: {
      //       type: "object",
      //       additionalProperties: false,
      //       properties: {
      //         list: {
      //           type: ["object", "null"],
      //           properties: {
      //             category: { type: "string" },
      //             subCategory: { type: "string" },
      //           },
      //           required: ["category", "subCategory"],
      //           additionalProperties: false,
      //         },
      //         aboutIsland: { type: "boolean" },
      //         more: {
      //           type: ["object", "null"],
      //           properties: {
      //             category: { type: "string" },
      //             subCategory: { type: "string" },
      //           },
      //           required: ["category", "subCategory"],
      //           additionalProperties: false,
      //         },
      //         single: {
      //           type: ["object", "null"],
      //           properties: {
      //             name: { type: "string", description: "try to get the best name of place/type/activity from the user message." },
      //           },
      //           required: ["name"],
      //           additionalProperties: false,
      //         },
      //       },
      //       required: ["list", "aboutIsland", "more", "single"],
      //     },
      //   },
      // },
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");

    return JSON.parse(content) as IntentClassification;
  } catch (error) {
    console.error("Intent classification error:", error);
    return {
      type: "general",
      name: null,
      category: null,
      subCategory: null,
    };
  }
}

export async function retrieveContext(
  intent: IntentClassification,
  question: string,
) {
  const knowledge = `
  K. Guraidhoo (Kaafu Atoll) is one of the most vibrant local inhabited islands in the Maldives. It offers a perfect gateway for travelers who want to swap high-end resort isolation for an authentic, budget-friendly slice of Maldivian island life.

Located just south of the highly commercialized Maafushi, Guraidhoo strikes a charming balance: it’s lively enough to have great guesthouses, dive centers, and cafes, yet quiet enough that you’ll still hear the morning boat engines, roosters, and kids playing football at dusk.

-Location: South Malé Atoll (Kaafu Atoll), roughly 31 kilometers (19 miles) south of Malé and Velana International Airport.

-Dimensions: It is a highly compact island, measuring roughly 700 meters long by 500 meters wide—you can easily walk end-to-end in about 10 to 15 minutes.

-Population: Around 1,900 to 2,000 residents.

Unique Feature: It is practically right next door to the luxury resort Holiday Inn Resort Kandooma Maldives—so close that you can see their overwater villas clearly from Guraidhoo's eastern shore!

Because Guraidhoo is a local inhabited island, Islamic customs apply. This means you cannot wear bikinis or revealing swimwear on the main village beaches. However, Guraidhoo has a brilliant workaround:

-Lhosfushi (The Picnic Island): This is a small, uninhabited island located right next to Guraidhoo. It is connected to the main island by a scenic wooden footbridge.

-The Bikini Beach: Lhosfushi serves as Guraidhoo’s designated "Bikini Beach". Here, tourists are completely free to sunbathe and swim in regular swimwear.

Note: The lagoon immediately off Lhosfushi is beautiful, but the seafloor can be a bit rocky with dead coral, so water shoes are highly recommended. The currents between the islands can also get quite strong, so swimmers should be cautious.


4. Local Culture & Infrastructure
Guraidhoo feels like a real, working Maldivian village. The streets are made of packed white sand, and the houses are painted in bright pastel shades.

Economy: Traditionally centered around fishing and boatbuilding. You can still walk down to the harbor and see locals working on traditional wooden dhoani hulls.

Healthcare: It hosts a local health center/small hospital and pharmacies. Fascinatingly, Guraidhoo is home to the Maldives' only dedicated psychiatric facility.

Shops & Dining: There are several souvenir shops, small grocery marts, and cozy local cafes (called hotaas).

Food: Don't miss out on trying Hedhikaa (traditional short eats) like bis keemiya (pastry filled with cabbage and egg) or masroshi alongside a cup of sweet black tea. Local eateries are very budget-friendly, though many take a midday break around prayer times and early afternoon.

Alcohol Policy: Because it is an inhabited island, alcohol is completely banned on Guraidhoo. If you want a drink, some guesthouses can organize evening trips to floating "bar boats" (safari yachts) anchored just offshore, where alcohol is legally served.

Dress Code: When walking through the village, respect the locals by keeping your shoulders and knees covered (simple t-shirts and shorts are perfectly fine!).
  `;

  switch (intent.type) {
    /**
     * No database required
     *
     * Examples:
     * currency
     * visa
     * packing
     * general travel questions
     */
    case "general":
      return null;

    /**
     * Static island information
     *
     * No Mongo read
     */
    case "knowledge":
      return knowledge; //getIslandKnowledge();

    /**
     * Exact business/place lookup
     *
     * Example:
     * "Tell me about Amore Cafe"
     */
    case "single": {
      if (!intent.name) {
        return null;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/listings?title=${intent.name}`,
      );
      const { data } = await res.json();
      return formatListing(data[0]);
    }

    /**
     * Category listing
     *
     * Example:
     * "restaurants"
     */
    case "category": {
      if (!intent.category) {
        return null;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/listings?category=${intent.category}&subCategory=${intent.subCategory}`,
      );
      const { data } = await res.json();
      return formatListings(data);
    }

    /**
     * Semantic search
     *
     * Example:
     * "quiet romantic dinner"
     */
    case "semantic": {
      await connectDB();

      // 1. Generate text embeddings targeting only the newest user question
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: question,
      });
      const vector = embeddingResponse.data[0].embedding;
console.log(vector)
      // 2. Optimized vector aggregation with tight projection limit
      const docs = await Listing.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: vector,
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
      ]);

      // 3. Compact contextual data layout formatting
(await connectDB()).close()
      return formatListings(docs); //await searchSimilarListings(question);
    }

    default:
      return null;
  }
}

export async function CATEGORY_META_CONFIGS() {
  "use cache"
  await connectDB();

  const items = await metaConfig.find();
  const structuredTree: Record<string, Record<string, any>> = {};

  if (!items) return structuredTree;

  items.forEach((doc) => {
    const item = doc.toObject ? doc.toObject() : doc;
    const category = item.category;

    // 1. If the top-level category doesn't exist yet, create it dynamically
    if (!structuredTree[category]) {
      structuredTree[category] = {};
    }

    // 2. Safely check if subCategories array exists on this document record
    if (Array.isArray(item.subCategories)) {
      item.subCategories.forEach((subCat: any) => {
        // Use the subcategory's name as the key (e.g., "restaurant")
        const subCategoryKey = subCat.name || "default";
        
        // Map the fields array directly underneath that key matching the target layout structure
        structuredTree[category][subCategoryKey] = subCat.fields || [];
      });
    }
  });

  return structuredTree;
}