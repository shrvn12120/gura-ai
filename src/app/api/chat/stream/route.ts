import { NextResponse } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/listing.model";
import { CATEGORIES } from "@/lib/categories";
import islandModel from "@/models/island.model";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ISLAND_ID = "6a2b3316882b534c9d608058";

export async function POST(req: Request) {
  try {
    const { message, conversation = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
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

    let filter: any = { islandId: ISLAND_ID };
    if (intent.category && intent.category !== "all") filter.category = intent.category;
    if (intent.subCategory && intent.subCategory !== "all") filter.subCategory = intent.subCategory;

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

    let listings = await Listing.find(
      filter,
      intent.keywords?.length ? { score: { $meta: "textScore" } } : {}
    )
      .sort(intent.keywords?.length ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .lean();

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
You are the official multilingual Guraidhoo Island Concierge.
Everything the user asks about relates to Guraidhoo Island.

CRITICAL IDENTITY RULES:
- If asked "who made you / who trained you / who owns you": Respond exactly with: "I was created and trained by Abdullah Sharuwaan."
- If asked "what is your purpose": Respond exactly with: "My purpose is to assist locals and tourists by providing helpful information about this island."
- Never use the word "master".

RESPONSE RULES:
- Translate your responses to match the user's spoken conversational language.
- Use official island data for generic questions: ${JSON.stringify(islandData)}.
- Use listing data for question about list: ${JSON.stringify(listings)}
- Recommend a maximum of 3 options at a time. Do not make up facts or prices.
- Your "message" field must contain a short, friendly, conversational introduction.
- NEVER repeat names, phone numbers, or exact prices in the main "message" field if they are already present inside the "ui.options" rows.

NAVIGATION & DIRECTIONS DECISION TREE:
1. If no matching destination is found, set "ui" to null and state in "message": "I couldn't find that specific place in Guraidhoo to give you directions."
2. If location coordinates are missing, set "hasCatalog" to true, but leave "ui.location" null. Explain that map coordinates are unavailable.
3. If user location is unknown, set "ui.requestLocation" to true and create a "share-location" action.
4. If coordinates are shared, set "ui.requestLocation" to false and generate a Google Maps routing URL.


-If user ask anything other than guraidhoo dont responde.
Available Listings Context:
${JSON.stringify(context, null, 2)}
`;

    /* ---------------------------
       Streamed OpenAI Call
    ---------------------------- */
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      stream: true, // ⚡ STREAM ENABLED
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "concierge_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              message: { type: "string", description: "Short conversation or descriptive markdown text answering the user. when giving information on navigation dont include map coordination of the message" },
              hasCatalog: { type: "boolean", description: "True if providing custom UI cards, false otherwise." },
              ui: {
                type: ["object", "null"],
                description: "Interactive layout block configurations.",
                properties: {
                  type: { type: "string", enum: ["place", "activity", "list", "info"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  categories: { type: "array", items: { type: "string" } },
                  requestLocation: { type: "boolean" },
                  location: {
                    type: ["object", "null"],
                    properties: { name: { type: "string" }, lat: { type: "number" }, lng: { type: "number" } },
                    required: ["name", "lat", "lng"],
                    additionalProperties: false
                  },
                  links: {
                    type: ["object", "null"],
                    properties: { website: { type: "string" }, facebook: { type: "string" }, instagram: { type: "string" } },
                    required: ["website", "facebook", "instagram"],
                    additionalProperties: false
                  },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["map", "call", "whatsapp", "email", "link", "booking", "share-location", "location-navigation"] },
                        label: { type: "string"},
                        url: {  type: "string",
      description:
        "When giving direction create a google map direction link from both coordinates" }
                      },
                      required: ["type", "label", "url"],
                      additionalProperties: false
                    }
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        contact: {
                          type: "object",
                          properties: { phone: { type: "string" }, whatsapp: { type: "string" } },
                          required: ["phone", "whatsapp"],
                          additionalProperties: false
                        },
                       location: {
  type: ["object", "null"],
  description:
    "Location data used to generate map links",
  properties: {
    name: { type: "string" },
    lat: { type: "number" },
    lng: { type: "number" },
    googleMapsUrl: {
      type: "string",
      description:
        "Generated Google Maps URL using lat/lng (https://www.google.com/maps?q=lat,lng)"
    }
  },
  required: ["name", "lat", "lng", "googleMapsUrl"],
  additionalProperties: false
}
                      },
                      required: ["name", "description", "contact", "location"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["type", "title", "description", "categories", "requestLocation", "location", "links", "actions", "options"],
                additionalProperties: false
              }
            },
            required: ["message", "hasCatalog", "ui"],
            additionalProperties: false
          }
        }
      },
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: message },
      ],
    });

    // Directly pipe chunks down the stream pipeline
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          controller.error(error);
        } {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });

  } catch (error) {
    console.error("STREAM CHAT API ERROR:", error);
    return NextResponse.json({ error: "Server error handling your stream request" }, { status: 500 });
  }
}

/* =====================================================
   INTENT EXTRACTION (Keeps non-streamed schema validation)
===================================================== */
async function extractIntent(message: string, conversation: any[] = []) {
  try {
    const validCategoryNames = CATEGORIES.map((c: any) => c.name);
    const allowedEnums = [...validCategoryNames, "all"];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0, 
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: "intent_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: { type: "string", enum: allowedEnums },
              subCategory: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              goal: { type: "string", enum: ["navigation", "find_place", "get_info", "compare", "greeting", "finding_location"] },
              confidence: { type: "number" },
              englishMessage: { type: "string" }
            },
            required: ["category", "subCategory", "keywords", "goal", "confidence", "englishMessage"],
            additionalProperties: false
          }
        }
      },
      messages: [
        {
          role: "system",
          content: `You are an intent classifier for Guraidhoo. Allowed categories: ${allowedEnums.join(", ")}.`,
        },
        ...conversation,
        { role: "user", content: message },
      ],
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } catch (err) {
    console.error("INTENT ERROR:", err);
    return { category: "all", subCategory: "all", keywords: [], goal: "get_info", confidence: 0, englishMessage: message };
  }
}