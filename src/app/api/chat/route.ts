// import { NextResponse } from "next/server";
// import OpenAI from "openai";
// import connectDB from "@/lib/mongodb";
// import Listing from "@/models/listing.model";
// import { CATEGORIES } from "@/lib/categories";
// import islandModel from "@/models/island.model";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// const ISLAND_ID = "6a2b3316882b534c9d608058";

// export async function POST(req: Request) {
//   try {
//     const {
//       message,
//       conversation = [],
//     } = await req.json();

//     if (!message) {
//       return NextResponse.json(
//         { error: "Message is required" },
//         { status: 400 }
//       );
//     }

   

//     /* ---------------------------
//        Clean conversation history
//     ---------------------------- */

//     const chatHistory = conversation
//       .slice(-20)
//       .filter(
//         (m: any) =>
//           m &&
//           (m.role === "user" ||
//             m.role === "assistant") &&
//           typeof m.content === "string"
//       );

//     /* ---------------------------
//        Extract intent using history
//     ---------------------------- */

//     const intent = await extractIntent(
//       message,
//       chatHistory
//     );

//     /* ---------------------------
//        Build Mongo query
//     ---------------------------- */
//     const filter: any = {
//       islandId: ISLAND_ID,
//     };

//     // if (intent.category && intent.category !== "all") {
//     //   filter.category = intent.category;
//     // }

//     // if (intent.subCategory && intent.subCategory !== "all") {
//     //   filter.subCategory = intent.subCategory;
//     // }

//     /* ================= 3. SEARCH STRATEGY ================= */

//     const keywordString = (intent.keywords || []).join(" ").trim();

//     if (keywordString) {
//       filter.$text = { $search: keywordString };
//     } else {
//       // fallback regex search
//       filter.$or = [
//         { name: { $regex: message, $options: "i" } },
//         { description: { $regex: message, $options: "i" } },
//         { subCategory: { $regex: message, $options: "i" } },
//       ];
//     }
//     /* ================= 4. FETCH DATA ================= */
//     await connectDB();

//     const islandData = await islandModel.findById("6a2b3316882b534c9d608058")
    
// console.log(filter)

//     const listings = await Listing.find(
//       filter,
//       intent.keywords?.length
//         ? { score: { $meta: "textScore" } }
//         : {}
//     )
//       .sort(
//         intent.keywords?.length
//           ? { score: { $meta: "textScore" } }
//           : { createdAt: -1 }
//       )
//       .lean();

//     /* ---------------------------
//        AI Context
//     ---------------------------- */

//     const context = listings.map((l: any) => ({
//       id: l._id,
//       name: l.name,
//       category: l.category,
//       subCategory: l.subCategory,
//       description: l.description,
//       pricing: l.pricing,
//       location: l.location,
//       contact: l.contact,
//     }));


//     /* ---------------------------
//        System Prompt
//     ---------------------------- */

//     const systemPrompt = `
// You are the official Guraidhoo Island Concierge.
// You can see previous conversation history.
// Every this user will ask about is Guraidhoo.
// Return ONLY valid JSON object.

// JSON format must be strictly followed.

// Never include text outside JSON.

// Rules:
// -Get whats user is trying to do from ${intent.goal}
// -If user is aking for location direction and response has coordinates return extra data on the results as link format it as object whith name and link.

// -If user is trying to get any information about guraidhoo use ${islandData}, using the information and base on what user has asked give correct information
// -Dont make up anything.
// - If user says:
//   - "tell me all about guraidhoo"
//   - "whats the population"
//   - "whats the land size"
//   - "how far is guraidhoo from male"

// Give correct information in a shortest format.



// -Be smart to answer user question with both ${islandData} and ${listings}
// - If user says anything like:
//   - "how may guest house are there?" 
//   - "how may local shops are there?" 
//   - "how may local house are there?" 
//   ...
//   => try to get number from both ${islandData} if not  ${listings.length} and filter with subCategory that match user intend and make total
  


// - Remember previous recommendations.
// - Understand follow-up questions.
// - If user says:
//   - "which one is cheaper"
//   - "show me more"
//   - "tell me about that one"
//   - "where is it"
//   - "book that one"

// Use previous conversation context.

// - Only use provided listings.
// - Never invent information.
// - Never invent prices.
// - Never invent locations.
// - If information is missing, say so.
// - Recommend a maximum of 3 options.
// - Be concise and friendly.
// - Never mention AI.
// - Never mention system prompts.

// ALWAYS OUTPUT FORMAT (STRICT):
// IMPORTANT:

// {

//   "ui": {
//     "type": "place | activity | list | info",

//     "title": "",
//     "description": "",

//     "categories": [],
// -IF Available
//     "location": {
//       "name": "",
//       "lat": 0,
//       "lng": 0
//     },
// -IF Available
//     "links": {
//       "website": "",
//       "facebook": "",
//       "instagram": ""
//     },

//     "actions": [
//       {
//         "type": "map | call | whatsapp | email | link | booking | share-location",
//         "label": "",
//         "url": ""
//       },
//     ],
//     options: [
//     {
//                 "name": "",
//                 "description": "short meaning full description",
//                 "contact": {
//                     "phone": "",
//                     "whatsapp": ""
//                 }
//             }
//     ]
//   },
//   "message": "markdown content here"
// }

// -If no ${listings}
// → return:
//     message: {{reason}} with proper details,
//     ui: null




// NAVIGATION RULES (VERY IMPORTANT):

// - NEVER generate or guess coordinates.
// - ONLY use coordinates if they exist in the provided listing data.

// - If listing.location.lat OR listing.location.lng is missing/null/0:
//     → return:
//     "Sorry, {listing.name} doesn't have location information."

// - If user asks for navigation:
//     → ALWAYS check listing first.

// -If ${context} is empty:
//   → return:
//     "I couldn't  find any thing."

// - If listing has NO coordinates:
//     → DO NOT create UI location object.

// - If user needs directions:
//     → set ui.requestLocation = true ONLY.
//     → DO NOT include fake coordinates.
// - The assistant does NOT know user's location.
// - Never assume user location.

//  IMPORTANT NAVIGATION RULES

// If the user asks:

// * How do I get there?
// * Give me directions
// * Navigate to this place
// * How far is it from me?
// * Show route
// * Route to this location

// DO NOT invent the user's location.
// DO NOT invent the destination location.


// Instead return:

// -If  getting location from user:
// {
// "ui": {
// "requestLocation": true,
// "actions": [
// {
// "type": "share-location",
// "label": "Share My Location",
// "link": ""
// }
// ]
// },
// "message": "To provide directions, I need your current location."
// }

// -If  giving user the navigation:
// {
// "ui": {
// "requestLocation": false,
// "actions": [
// {
// "type": "location-navigation",
// "label": "Visit the link",
// "a": "{{create a google map link from user coordinates and destination coordinates from listed location }}"
// }
// ]
// },
// "message": "{{a meaningfull message.}}"
// }

// The assistant cannot access the user's GPS location directly.

// Never return fake coordinates.
// Never guess the user's location.




// Listings:

// ${JSON.stringify(context, null, 2)}
// `;

//     /* ---------------------------
//        Generate response
//     ---------------------------- */

//     const response =
//       await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         temperature: 0.4,
//         response_format: {type: "json_object"},
//         messages: [
//           {
//             role: "system",
//             content: systemPrompt,
//           },

//           ...chatHistory,

//           {
//             role: "user",
//             content: message,
//           },
//         ],
//       });

// const raw = response.choices[0]?.message?.content || ``;

// const pares: {ui: any, message: string} = JSON.parse(raw)






// if (pares?.ui) {
//   // structured response
//   return NextResponse.json({
//     message: pares.message || "",
//     ui: pares.ui,

//   });
// }

// // fallback → plain text response
// return NextResponse.json({
//   message: pares.message,
//   ui: null,
// });








//   } catch (error) {
//     console.error(
//       "CHAT API ERROR:",
//       error
//     );

//     return NextResponse.json(
//       {
//         error: "Server error",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }

// /* =====================================================
//    INTENT EXTRACTION
// ===================================================== */

// async function extractIntent(
//   message: string,
//   conversation: any[] = []
// ) {

  
//   try {
//     const response =
//       await openai.chat.completions.create({
//         model: "gpt-4o-mini",
//         temperature: 0,
//         response_format: {
//           type: "json_object",
//         },
//         messages: [
//           {
//             role: "system",
//             content: `
// You are an intent classifier for a Maldives travel assistant.

// Use BOTH:
// - Current user message
// - Previous conversation

// Allowed categories:

// ${CATEGORIES}

// Examples:

// "Where can I stay?"
// => accommodation

// "Best guesthouses?"
// => accommodation

// "Where can I eat?"
// => restaurant

// "Good coffee shop?"
// => restaurant

// "Scuba diving?"
// => activity

// "Snorkeling trips?"
// => activity

// "Can i hire a buggy?"=> taxi-buggy-rental

// "Rent a bike?"
// => rental

// "Boat hire?"
// => rental

// "Where is Bikini Beach?"
// => places

// "What can I visit?"
// => places

// Return ONLY JSON:

// {
//   "category": "",
//   "subCategory": "all",
//   "keywords": [],
//   "goal": "",
//   "confidence": 0
// }

// Rules:

// - Understand meaning.
// - Use conversation history.
// - If user asks:
//   "Which one is cheapest?"
//   keep previous category.

// - Keywords should be short.
// - No markdown.
// - No explanations.
// - Always return what user is trying to find and set to goal, the best like "navigation" | "find_place" | "get_info" | "compare" | "greeting"


// `,
//           },

//           ...conversation,

//           {
//             role: "user",
//             content: message,
//           },
//         ],
//       });

//     const content =
//       response.choices[0]?.message?.content;

//     if (!content) {
//       throw new Error(
//         "Empty intent response"
//       );
//     }

//     return JSON.parse(content);
//   } catch (err) {
//     console.error(
//       "INTENT ERROR:",
//       err
//     );

//     return {
//       category: "all",
//       subCategory: "all",
//       keywords: [],
//       confidence: 0,
//     };
//   }
// }


import { NextResponse } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/listing.model";
import { CATEGORIES } from "@/lib/categories";
import islandModel from "@/models/island.model";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ISLAND_ID = "6a2b3316882b534c9d608058";

export async function POST(req: Request) {
  try {
    const { message, conversation = [] } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    /* ---------------------------
       Clean conversation history
    ---------------------------- */
    const chatHistory = conversation
      .slice(-20)
      .filter(
        (m: any) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      );

    /* ---------------------------
       Extract intent using history
    ---------------------------- */
    const intent = await extractIntent(message, chatHistory);

/* ================= 3. SEARCH STRATEGY ================= */
    const keywordString = (intent.keywords || []).join(" ").trim();

    // Strategy A: Strict Filtering based on Intent
    let filter: any = { islandId: ISLAND_ID };
    
    if (intent.category && intent.category !== "all") {
      filter.category = intent.category;
    }
    if (intent.subCategory && intent.subCategory !== "all") {
      filter.subCategory = intent.subCategory;
    }

    if (keywordString) {
      filter.$text = { $search: keywordString };
    } else {
      filter.$or = [
        { name: { $regex: message, $options: "i" } },
        { description: { $regex: message, $options: "i" } }
      ];
    }

    /* ================= 4. FETCH DATA WITH FALLBACK ================= */
    await connectDB();
    const islandData = await islandModel.findById(ISLAND_ID);

    // Run our first strict query
    let listings = await Listing.find(
      filter,
      intent.keywords?.length ? { score: { $meta: "textScore" } } : {}
    )
      .sort(intent.keywords?.length ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .lean();

      console.log({intent, listings})

    /* 
       👉 RELAXATION STEP: If the strict intent-matching returned zero results, 
       the intent classifier likely made a mistake. Let's fall back to a wide text 
       search disregarding the category constraints so the user gets an answer.
    */
    if (listings.length === 0) {
      const fallbackFilter: any = { islandId: ISLAND_ID };
      
      if (keywordString) {
        fallbackFilter.$text = { $search: keywordString };
      } else {
        fallbackFilter.$or = [
          { name: { $regex: message, $options: "i" } },
          { description: { $regex: message, $options: "i" } },
          { category: { $regex: message, $options: "i" } },
          { subCategory: { $regex: message, $options: "i" } }
        ];
      }

      listings = await Listing.find(
        fallbackFilter,
        intent.keywords?.length ? { score: { $meta: "textScore" } } : {}
      )
        .sort(intent.keywords?.length ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .lean();
    }

    /* ---------------------------
       AI Context
    ---------------------------- */
    const context = listings.map((l: any) => ({
      id: l._id,
      name: l.name,
      category: l.category,
      subCategory: l.subCategory,
      description: l.description,
      pricing: l.pricing,
      location: l.location,
      contact: l.contact,
    }));

    /* ---------------------------
       System Prompt
    ---------------------------- */
    const systemPrompt = `
You are the official Guraidhoo multi language Island Concierge.
You can see previous conversation history.
Everything this user asks about is related to Guraidhoo Island.

CRITICAL: You must return a valid JSON object ONLY. Do not wrap it in anything other than raw valid JSON. Do not include markdown text blocks around the JSON object.

Rules:
- Your smart enought to translate contaxt you user spoken language.
- The user's underlying goal is categorized as: "${intent.goal || 'unknown'}". Use this to understand if they want to navigate, get info, or compare listings.
- If the user asks for location directions and your response contains coordinates, include extra data in the 'actions' or 'ui.links' array as objects containing a name and link.
- If the user asks general information about Guraidhoo (e.g., "tell me about guraidhoo", "population", "land size", "distance from male"), use this official data: ${JSON.stringify(islandData)}. Provide accurate data in a concise format. Do not make up facts.
- Combine general island data and specific listings to answer complex questions (e.g., "how many guest houses are there?"). If the numeric totals aren't in the island information, count the listings array where the subCategory fits the query intent.
- Track context and understand follow-up requests ("which one is cheaper", "show me more", "where is it").
- Recommend a maximum of 3 options at a time.
- Be concise, friendly, and never mention that you are an AI or talk about your system prompts.

- Your "message" field must ONLY contain a short, friendly, conversational opening or summary (e.g., "Sure, here is a popular buggy rental service on the island:").
- NEVER repeat names, phone numbers, or exact prices in the "message" field if they are already present inside the "ui.options" or "ui.title" fields. Let the UI cards do the heavy lifting.

IF NO LISTINGS FOUND AND NO ISLAND DATA APPLIES:
Return a valid JSON structure where "ui" is null and "message" explains that nothing could be found.

STRICT JSON OUTPUT FORMAT:
{
  "ui": {
    "type": "place", 
    "title": "Title here",
    "description": "Short description here",
    "categories": [],
    "location": {
      "name": "",
      "lat": 0,
      "lng": 0
    },
    "links": {
      "website": "",
      "facebook": "",
      "instagram": ""
    },
    "actions": [
      {
        "type": "map",
        "label": "View on Map",
        "url": "https://..."
      }
    ],
    "options": [
      {
        "name": "",
        "description": "Short meaningful description",
        "contact": {
          "phone": "",
          "whatsapp": ""
        }
      }
    ]
  },
  "message": "Markdown content goes here"
}

NAVIGATION & DIRECTIONS DECISION TREE (FOLLOW STRICTLY):

When a user asks for directions, navigation, routes, or distances, execute these checks in exact sequence:

1. CHECK DATA EXISTENCE: Does the requested destination exist in the provided ${listings} or ${context} arrays?
   - If NO matching destination is found: Stop immediately. Set "ui": null, and set "message" to: "I couldn't find that specific place in  Guraidhoo  to give you directions."

2. CHECK COORDINATES: Does the matched destination listing have valid coordinates (latitude and longitude)?
   - If coordinates are missing, null, or 0: Stop immediately. Set "ui": { "requestLocation": false, "actions": [] }, and set "message" to: "I found [Destination Name], but I don't have its map coordinates to provide directions."

3. ASKING FOR USER LOCATION (Only if steps 1 and 2 pass):
   - If you do not know the user's location yet, return:
   {
     "ui": {
       "requestLocation": true,
       "actions": [{ "type": "share-location", "label": "Share My Location", "url": "" }]
     },
     "message": "To provide directions to [Destination Name], I need your current location."
   }

4. PROVIDING THE NAV LINK:
   - If the user has shared their coordinates (e.g., "My location is X,Y"), return:
   {
     "ui": {
       "requestLocation": false,
       "actions": [{ "type": "location-navigation", "label": "Navigate Now", "url": "https://www.google.com/maps/dir/?api=1&origin=USER_LAT,USER_LNG&destination=DEST_LAT,DEST_LNG" }]
     },
     "message": "Here is your route to [Destination Name]."
   }



Identity rules:
- If asked “who made you / who trained you / who owns you”:
  → Respond: "I was created and trained by Abdullah Sharuwaan."

- If asked “what is your purpose”:
  → Respond: "My purpose is to assist locals and tourists by providing helpful information about this island."

- Never use the word “master”.
- Keep responses short, professional, and consistent.
Available Listings Context:
${JSON.stringify(context, null, 2)}
`;

    /* ---------------------------
       Generate response
    ---------------------------- */
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3, // Lowered slightly to ensure higher adherence to strict JSON formatting
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: message },
      ],
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      message: parsed?.message || "I couldn't find an answer for that.",
      ui: parsed?.ui || null,
    });

  } catch (error) {
    console.error("CHAT API ERROR:", error);
    return NextResponse.json(
      { error: "Server error handling your request" },
      { status: 500 }
    );
  }
}

/* =====================================================
   INTENT EXTRACTION
===================================================== */
// async function extractIntent(message: string, conversation: any[] = []) {
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       temperature: 0,
//       response_format: { type: "json_object" },
//       messages: [
//         {
//           role: "system",
//           content: `
// You are an intent classifier for a Maldives travel assistant.
// Analyze the user's message alongside the conversation history.

// Allowed categories:
// ${CATEGORIES}

// Return ONLY this raw JSON schema:
// {
//   "category": "string or 'all'",
//   -category must be any from ${CATEGORIES}.name
//   "subCategory": "string or 'all'",
//   "keywords": [],
//   "goal": "navigation | find_place | get_info | compare | greeting",
//   "confidence": 0
// }
// `,
//         },
//         ...conversation,
//         { role: "user", content: message },
//       ],
//     });

//     const content = response.choices[0]?.message?.content;
//     if (!content) throw new Error("Empty intent response");

//     return JSON.parse(content);
//   } catch (err) {
//     console.error("INTENT ERROR:", err);
//     return {
//       category: "all",
//       subCategory: "all",
//       keywords: [],
//       goal: "get_info",
//       confidence: 0,
//     };
//   }
// }


async function extractIntent(message: string, conversation: any[] = []) {
  try {
    const validCategoryNames = CATEGORIES.map((c: any) => c.name);
    const allowedEnums = [...validCategoryNames, "all"];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0, // Kept at 0 for strict translation and classification accuracy
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: "intent_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: allowedEnums,
                description: "The primary classification category match."
              },
              subCategory: {
                type: "string",
                description: "Specific subcategory or 'all' if not defined."
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Search terms extracted out of the user input, translated strictly into English."
              },
              goal: {
                type: "string",
                enum: ["navigation", "find_place", "get_info", "compare", "greeting"],
                description: "The primary action vector intention of the user."
              },
              confidence: {
                type: "number",
                description: "Confidence ranking scalar from 0 to 1."
              },
              // 👉 NEW TRANSLATION VALUE ADDED TO SCHEMA
              englishMessage: {
                type: "string",
                description: "The full user message cleanly translated into English if written in another language. Keep as is if already in English."
              }
            },
            required: ["category", "subCategory", "keywords", "goal", "confidence", "englishMessage"],
            additionalProperties: false
          }
        }
      },
      messages: [
        {
          role: "system",
          content: `
You are a multilingual intent classifier and real-time translator for a Maldives travel assistant.
Analyze the user's message alongside the conversation history.

CRITICAL INSTRUCTIONS:
1. Detect the language of the incoming user message.
2. In the "englishMessage" field, provide a clean, accurate translation of the user's message into English. 
3. Extract search "keywords" exclusively as lowercase English terms.
4. Allowed category variables are strictly: ${allowedEnums.join(", ")}.
`,
        },
        ...conversation,
        { role: "user", content: message },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty intent response");

    return JSON.parse(content);
  } catch (err) {
    console.error("INTENT ERROR:", err);
    return {
      category: "all",
      subCategory: "all",
      keywords: [],
      goal: "get_info",
      confidence: 0,
      englishMessage: message // Fall back to the original message text if translation crashes
    };
  }
}