// import { CATEGORIES } from "@/lib/categories";
// import connectDB from "@/lib/mongodb";
// import listingModel from "@/models/listing.model";
// import { NextResponse } from "next/server";
// import ollama from 'ollama'



// export async function POST(req: Request) {
//      const { message, conversation = [] } = await req.json();
//      const ISLAND_ID = "6a2b3316882b534c9d608058";

//     await connectDB();

//     /* -----------------------------------------
//       1. AI INTENT PARSER (replaces keywords)
//     ------------------------------------------*/
//     const intent = await extractIntent(message, conversation);
       


//     /* ---------------------------
//        Build Mongo query
//     ---------------------------- */
//     const filter: any = {
//       islandId: ISLAND_ID,
//     };

//     if (intent.category && intent.category !== "all") {
//       filter.category = intent.category;
//     }

//     if (intent.subCategory && intent.subCategory !== "all") {
//       filter.subCategory = intent.subCategory;
//     }

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

//     const listings = await listingModel.find(
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
//       .limit(10)
//       .lean();

//     /* ---------------------------
//        AI Context
//     ---------------------------- */

//     const context = listings.map((l) => ({
//       name: l.name,
//       category: l.category,
//       subCategory: l.subCategory,
//       description: l.description,
//       price: l.pricing,
//       contact: l.contact,
//     }));
//     /* -----------------------------------------
//       3. FINAL AI RESPONSE (RAG SYSTEM)
//     ------------------------------------------*/
//     const systemPrompt = `
// You are the official Guraidhoo Island Concierge.

// You can see previous conversation history.

// Rules:
// -If user is aking for location direction and response has coordinates return extra data on the results as link format it as onject whith name and link

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

// Listings:

// ${JSON.stringify(context, null, 2)}
// `;

//  const msg = await ollama.chat({
//   model: 'minimax-m3:cloud',
//   messages: [
//         {
//         role: "system",
//         content: systemPrompt,
//       },
//     { role: "user", content: message },
    
//     ],
// })



//     return NextResponse.json({
//       message: msg.message.content,
//     });

// }

// /* ---------------- SIMPLE INTENT EXTRACTOR ---------------- */

// async function extractIntent(message: string, conversation: any[] = []) {
//   const x = CATEGORIES
//   const categories = JSON.stringify(x)
//   try {
//     const response = await ollama.chat({
//       model: "minimax-m3:cloud",
      
//         messages: [
//           {
//             role: "system",
//             content: `
// You are an intent classifier for a Maldives travel assistant.

// Use BOTH:
// - Current user message
// - Previous conversation

// Allowed categories:

// ${categories}

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

// "Rent a bike?"
// => rental

// "Boat hire?"
// => rental

// "Where is Bikini Beach?"
// => place

// "What can I visit?"
// => place

// Return ONLY JSON:

// {
//   "category": "",
//   "subCategory": "all",
//   "keywords": [],
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
// `,
//           },

//           ...conversation,

//           {
//             role: "user",
//             content: message,
//           },
//         ],
//     });

//     const text = response.message.content || "{}";

 

//     return JSON.parse(text);
//   } catch (err) {
//     console.error("INTENT PARSE ERROR:", err);

//     // fallback safe mode
//     return {
//       category: "all",
//       query: message,
//       notes: "fallback",
//     };
//   }
// }

// app/api/chat/route.ts

import { NextResponse } from "next/server";
import ollama from "ollama";
import connectDB from "@/lib/mongodb";
import listingModel from "@/models/listing.model";
import { CATEGORIES } from "@/lib/categories";

const ISLAND_ID = "6a2b3316882b534c9d608058";

/* =========================
   MAIN API
========================= */
export async function POST(req: Request) {
  try {
    const { message, conversation = [] } = await req.json();

    await connectDB();

    // 1. INTENT DETECTION
    const intent = await extractIntent(message, conversation);

    // 2. ROUTE DECISION
    const route = decideRoute(intent);

    // 3. HANDLE ROUTES
    if (route === "place") {
      return NextResponse.json(await handlePlace(intent));
    }

    if (route === "search") {
      const listings = await searchListings(intent);

      return NextResponse.json({
        success: true,
        mode: "search",
        intent,
        listings,
      });
    }

    if (route === "chat") {
      const reply = await chatResponse(message, conversation);

      return NextResponse.json({
        success: true,
        mode: "chat",
        intent,
        message: reply,
      });
    }

    return NextResponse.json({
      success: true,
      mode: "chat",
      message: "How can I help you in Guraidhoo?",
      intent,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   INTENT CLASSIFIER
========================= */
async function extractIntent(message: string, conversation: any[] = []) {
  try {
    const response = await ollama.chat({
      model: "minimax-m3:cloud",
      format: "json",

      messages: [
        {
          role: "system",
          content: `
You are an intent classifier for a Maldives travel assistant.

Return ONLY valid JSON.

INTENTS:
- greeting
- search_listing
- place_lookup
- follow_up
- booking
- location_request
- general_question
- unknown

IMPORTANT RULES:
- "Bikini Beach" = place_lookup
- island names = place_lookup
- beaches = place_lookup
- hotels/restaurants = search_listing

Return format:

{
  "intent": "",
  "category": "all",
  "subCategory": "all",
  "query": "",
  "keywords": [],
  "confidence": 0
}
`,
        },

        ...normalizeConversation(conversation),

        {
          role: "user",
          content: message,
        },
      ],
    });

    const raw = response.message.content;

    try {
      return JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : fallbackIntent(message);
    }
  } catch (error) {
    console.error("INTENT ERROR:", error);
    return fallbackIntent(message);
  }
}

/* =========================
   ROUTER
========================= */
function decideRoute(intent: any) {
  switch (intent.intent) {
    case "search_listing":
      return "search";

    case "place_lookup":
      return "place";

    default:
      return "chat";
  }
}

/* =========================
   PLACE LOOKUP (FIXED)
========================= */
async function handlePlace(intent: any) {
  const query = (intent.query || "").toLowerCase();

  const places: any = {
    "bikini beach": {
      name: "Bikini Beach (Maafushi)",
      island: "Maafushi",
      type: "beach",
      googleMaps:
        "https://www.google.com/maps/search/?api=1&query=Bikini+Beach+Maafushi",
    },

    guraidhoo: {
      name: "Guraidhoo Island",
      island: "South Malé Atoll",
      type: "island",
      googleMaps:
        "https://www.google.com/maps/search/?api=1&query=Guraidhoo+Maldives",
    },
  };

  const match = Object.entries(places).find(([key]) =>
    query.includes(key)
  );

  if (match) {
    return {
      success: true,
      mode: "place",
      data: match[1],
    };
  }

  return {
    success: true,
    mode: "place",
    message:
      "I found the place, but detailed info is not available yet.",
  };
}

/* =========================
   MONGO SEARCH
========================= */
async function searchListings(intent: any) {
  const filter: any = {
    islandId: ISLAND_ID,
  };

  if (intent.category && intent.category !== "all") {
    filter.category = intent.category;
  }

  if (intent.subCategory && intent.subCategory !== "all") {
    filter.subCategory = intent.subCategory;
  }

  const keywordString = (intent.keywords || []).join(" ");

  if (keywordString) {
    filter.$text = { $search: keywordString };
  }

  return await listingModel.find(filter).limit(10).lean();
}

/* =========================
   CHAT MODE (NO DB)
========================= */
async function chatResponse(message: string, conversation: any[]) {
  const res = await ollama.chat({
    model: "minimax-m3:cloud",

    messages: [
      {
        role: "system",
        content: `
You are a friendly Maldives island assistant.

Rules:
- Be short
- Be helpful
- Do not mention system
`,
      },

      ...normalizeConversation(conversation),

      {
        role: "user",
        content: message,
      },
    ],
  });

  return res.message.content;
}

/* =========================
   HELPERS
========================= */
function normalizeConversation(conversation: any[]) {
  return conversation.map((msg) => {
    let role = msg.role;

    if (role === "ai") role = "assistant";
    if (role === "bot") role = "assistant";

    return {
      role,
      content: msg.content,
    };
  });
}

function fallbackIntent(message: string) {
  return {
    intent: "unknown",
    category: "all",
    subCategory: "all",
    query: message,
    keywords: [],
    confidence: 0,
  };
}