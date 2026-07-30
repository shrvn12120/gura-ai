"use server";

import { MetaConfig } from "@/components/admin/meta-config/types";
import { formatListing, formatListings } from "@/lib/list-format";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";
import metaConfig from "@/models/MetaConfig";
import Notice from "@/models/Notice";
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



// export async function classifyIntent(
//   message: string,
//   conversation: OpenAI.Chat.ChatCompletionMessageParam[],
// ): Promise<IntentClassification> {

//     const configs = await getMetaConfigs();
//     const categoryText = configs.map((c)=>{
//       const subs = c.subCategories.filter(((sub)=> sub.name !== "default"))
//       .map((sub)=>{
//         return sub.name
//       }).join("\n");
//     return `${c.category}:\n${subs}`;
//     })
//   .join("\n\n");

// const classifierPrompt = `
// You are an intent classifier for the Explore Guraidhoo AI assistant.

// Your ONLY job is to classify the user's message.

// DO NOT answer the user.

// Return ONLY valid JSON.



// ------------------------------------
// AVAILABLE INTENT TYPES
// ------------------------------------

// There are ONLY FOUR possible intent types.

// 1. knowledge

// Use when the user is asking for general information about Guraidhoo that does NOT require searching listings.
// if user message is matching in any category listed, do not return knowledge as intention type.

// Examples:

// - Where is Guraidhoo?
// - Tell me about Guraidhoo.
// - History of Guraidhoo.
// - Population of Guraidhoo.
// - Currency.
// - Local customs.
// - Things to know before visiting.

// Return:

// {
//   "type":"knowledge",
//   "name":null,
//   "category":null,
//   "subCategory":null
// }

// ------------------------------------

// 2. single

// Use ONLY when the user is asking about ONE specific business, place, organization or listing.

// A business/place name must be identifiable in the message.

// Examples:

// - Tell me about Amore Cafe
// - Silver Fin Restaurant
// - Does Kaafu Inn have WiFi?
// - Show photos of Arena Beach
// - Where is Guraidhoo Health Centre?
// - Call Muranga Chill

// Return:

// {
//   "type":"single",
//   "name":"<exact business name as written by the user>",
//   "category":null,
//   "subCategory":null
// }

// Rules:

// - Preserve the business name exactly as written.
// - Never modify spelling.
// - Never guess missing names.

// ------------------------------------

// 3. category

// Use when the user wants MULTIPLE listings from a known category.

// Category filtering alone should be enough.

// Available Categories:

// ${categoryText}

// Examples:

// - Restaurants
// - Guesthouses
// - Cafes
// - Hotels
// - Shops
// - Dive centres
// - Watersports
// - Beaches
// - Mosques
// - Parks
// - Arrivals and departure information
// - Ferry schedules

// Government & Public Services

// If the request is about:

// - police
// - health centre
// - hospital
// - clinic
// - government office
// - council
// - immigration
// - public services
// - emergency assistance
// - someone stole my wallet
// - I need medical help

// Return:

// {
//   "type":"category",
//   "category":"organization",
//   "subCategory":"government"
// }

// Examples:

// "I need a doctor"

// {
//  "type":"category",
//  "category":"organization",
//  "subCategory":"government"
// }

// "My wallet was stolen"

// {
//  "type":"category",
//  "category":"organization",
//  "subCategory":"government"
// }

// ------------------------------------

// 4. semantic

// Use when the user is describing WHAT they want instead of WHO they want.

// These requests REQUIRE semantic/vector search.

// Examples:

// - Cheap accommodation
// - Romantic dinner
// - Best sunset restaurant
// - Quiet guesthouse
// - Best snorkeling
// - Family friendly activities
// - Good coffee
// - Beachfront hotel
// - Restaurant with vegan food
// - Place to watch sunset
// - Best swimming spot
// - Hotel near bikini beach


// Return:

// {
//   "type":"semantic",
//   "name":null,
//   "category":"<best matching category if known>",
//   "subCategory":"<best matching subcategory if known>"
//   "needsWebSearch": false
// }

// ------------------------------------
// DECISION RULES
// ------------------------------------

// Follow these rules IN ORDER.

// Rule 1

// If the message contains a specific business/place/listing name

// → type = "single"

// Rule 2

// Else if the user wants multiple businesses from a known category

// → type = "category"

// Rule 3

// Else if the user describes qualities, preferences or attributes that require finding the most relevant listings

// → type = "semantic"

// Rule 4

// Asking About Guraidhoo island

// → type = "knowledge"

// ------------------------------------
// IMPORTANT RULES
// ------------------------------------

// Never answer the user's question.

// Return ONLY JSON.

// Never wrap JSON inside markdown.

// Never explain your decision.

// Never invent business names.

// Never invent categories outside the provided category list.

// If category or subCategory is unknown, return null.

// If user intention is unclear output type must be semantic.


// ------------------------------------
// OUTPUT SCHEMA
// ------------------------------------

// {
//   "type":"knowledge | single | category | semantic",
//   "name":null,
//   "category":null,
//   "subCategory":null,
// }
// `


//   try {
//     // 1. Build the complete message history with the classification system instructions first
//     const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
//       {
//         role: "system",
//         content: classifierPrompt,
//       },
//       ...conversation, // Spreads previous back-and-forth turns
//       {
//         role: "user",
//         content: message, // Appends the latest message to classify
//       },
//     ];

//     // 2. Execute the completion using strict JSON schema validation
//     const response = await openai.chat.completions.create({
//       model:"gpt-4.1-nano", // Standard chat completion models work best with conversation parameters
//       messages: messages,
//       response_format: {
//         type: "json_object",
//       },
//     });

//     const content = response.choices[0].message.content;
//     if (!content) throw new Error("Empty response from OpenAI");

//     return JSON.parse(content) as IntentClassification;
//   } catch (error) {
//     console.error("Intent classification error:", error);
//     return {
//       type: "general",
//       name: null,
//       category: null,
//       subCategory: null,
//     };
//   }
// }
export async function classifyIntent(
  message: string,
  conversation: OpenAI.Chat.ChatCompletionMessageParam[],
): Promise<IntentClassification> {
  const configs = await getMetaConfigs();
  
// Format categories as a clear lookup schema to enforce strict parent-child matching
  const categoryText = configs
    .map((c) => {
      const subs = c.subCategories
        .filter((sub) => sub.name !== "default")
        .map((sub) => `"${sub.name}"`)
        .join(", ");
      return `  "${c.category}": [${subs || ""}]`;
    })
    .join(",\n");

  const classifierPrompt = `You are a strict JSON intent classifier for the Explore Guraidhoo AI assistant. 
Your ONLY job is to output a raw JSON object matching the schema below. Do not include markdown code fences or conversational text.

VALID CATEGORY TO SUBCATEGORY MAPPINGS:
{
${categoryText}
}
do not create any CATEGORY to SUBCATEGORY on your own.

INTENT TYPES & RULES:
1. "knowledge": ONLY for broad, general, or encyclopedia-style facts about Guraidhoo island itself (e.g., location, history, population, weather, local laws, customs, currency). If they want a business, service, place to visit, or activity. if conversation has any matching category dont return knowledge as type.
2. "single": The user mentions a specific, identifiable name of a business, venue, or service. Extract the exact name into the "name" field.
3. "category": The user wants to see multiple options from a specific category. 
   * CRITICAL PARENT-CHILD RULE: The "subCategory" must strictly belong to the chosen "category" based on the mappings provided above. Never mix a subcategory from one category into another. If a category has no subcategories or the specific subcategory isn't clear, set "subCategory" to default.
   * GOVERNMENT EMERGENCY EXCEPTION: If they mention terms like "police", "doctor", "hospital", "clinic", "office", "stolen", or "emergency", immediately route to category="organization" and subCategory="government".
4. "semantic": The user describes qualities, preferences, budgets, or attributes rather than naming a specific category or place (e.g., "cheap stay", "romantic dinner"). Default to this if unclear.and when user is trying to find alternatives

OUTPUT SCHEMA:
{
  "type": "knowledge" | "single" | "category" | "semantic",
  "name": string | null,
  "category": string | null,
  "subCategory": string | null
}`;

  try {
    // Token Saver: Only take the last 2 messages for immediate conversational context
    const recentHistory = conversation.slice(-2);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: classifierPrompt },
      ...recentHistory,
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano", 
      messages: messages,
      temperature: 0, // Set to 0 for maximum deterministic accuracy
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response");

    return JSON.parse(content.trim()) as IntentClassification;
  } catch (error) {
    console.error("Intent classification error:", error);
    return {
      type: "semantic", // Fallback to semantic as requested by your original rules
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

export async function getNotice(){

    await connectDB();


    const res = await Notice
        .find({
            isActive:true
        })
        .sort({
            createdAt:-1
        });
if(!res){
  return []
}

const data = res.map((res)=>{
  return {
    _id: res._id.toString(),
    message: res.message,
    type: res.type,
    title: res.title
  }
})

    return data;
}