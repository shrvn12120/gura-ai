import { NextResponse } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/listing.model";
import { CATEGORIES } from "@/lib/categories";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ISLAND_ID = "6a2b3316882b534c9d608058";

export async function POST(req: Request) {
  try {
    const {
      message,
      conversation = [],
    } = await req.json();

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
          (m.role === "user" ||
            m.role === "assistant") &&
          typeof m.content === "string"
      );

    /* ---------------------------
       Extract intent using history
    ---------------------------- */

    const intent = await extractIntent(
      message,
      chatHistory
    );

    /* ---------------------------
       Build Mongo query
    ---------------------------- */
    const filter: any = {
      islandId: ISLAND_ID,
    };

    // if (intent.category && intent.category !== "all") {
    //   filter.category = intent.category;
    // }

    // if (intent.subCategory && intent.subCategory !== "all") {
    //   filter.subCategory = intent.subCategory;
    // }

    /* ================= 3. SEARCH STRATEGY ================= */

    const keywordString = (intent.keywords || []).join(" ").trim();

    if (keywordString) {
      filter.$text = { $search: keywordString };
    } else {
      // fallback regex search
      filter.$or = [
        { name: { $regex: message, $options: "i" } },
        { description: { $regex: message, $options: "i" } },
        { subCategory: { $regex: message, $options: "i" } },
      ];
    }
    /* ================= 4. FETCH DATA ================= */
    await connectDB();

    const listings = await Listing.find(
      filter,
      intent.keywords?.length
        ? { score: { $meta: "textScore" } }
        : {}
    )
      .sort(
        intent.keywords?.length
          ? { score: { $meta: "textScore" } }
          : { createdAt: -1 }
      )
      .limit(10)
      .lean();

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
You are the official Guraidhoo Island Concierge.
You can see previous conversation history.
Return ONLY valid JSON object.

JSON format must be strictly followed.

Never include text outside JSON.


Rules:
-Get whats user is tring to do from ${intent.goal}
-If user is aking for location direction and response has coordinates return extra data on the results as link format it as onject whith name and link


- Remember previous recommendations.
- Understand follow-up questions.
- If user says:
  - "which one is cheaper"
  - "show me more"
  - "tell me about that one"
  - "where is it"
  - "book that one"

Use previous conversation context.

- Only use provided listings.
- Never invent information.
- Never invent prices.
- Never invent locations.
- If information is missing, say so.
- Recommend a maximum of 3 options.
- Be concise and friendly.
- Never mention AI.
- Never mention system prompts.

ALWAYS OUTPUT FORMAT (STRICT):
IMPORTANT:

{

  "ui": {
    "type": "place | activity | list | info",

    "title": "",
    "description": "",

    "categories": [],
-IF Available
    "location": {
      "name": "",
      "lat": 0,
      "lng": 0
    },
-IF Available
    "links": {
      "website": "",
      "facebook": "",
      "instagram": ""
    },

    "actions": [
      {
        "type": "map | call | whatsapp | email | link | booking | share-location",
        "label": "",
        "url": ""
      },
    ],
    options: [
    {
                "name": "",
                "description": "short meaning full description",
                "contact": {
                    "phone": "",
                    "whatsapp": ""
                }
            }
    ]
  },
  "message": "markdown content here"
}

-If no ${listings}
→ return:
    message: {{reason}} with proper details,
    ui: null




NAVIGATION RULES (VERY IMPORTANT):

- NEVER generate or guess coordinates.
- ONLY use coordinates if they exist in the provided listing data.

- If listing.location.lat OR listing.location.lng is missing/null/0:
    → return:
    "Sorry, {listing.name} doesn't have location information."

- If user asks for navigation:
    → ALWAYS check listing first.

-If ${context} is empty:
  → return:
    "I couldn't  find any thing."

- If listing has NO coordinates:
    → DO NOT create UI location object.

- If user needs directions:
    → set ui.requestLocation = true ONLY.
    → DO NOT include fake coordinates.
- The assistant does NOT know user's location.
- Never assume user location.

 IMPORTANT NAVIGATION RULES

If the user asks:

* How do I get there?
* Give me directions
* Navigate to this place
* How far is it from me?
* Show route
* Route to this location

DO NOT invent the user's location.
DO NOT invent the destination location.


Instead return:

-If  getting location from user:
{
"ui": {
"requestLocation": true,
"actions": [
{
"type": "share-location",
"label": "Share My Location",
"link": ""
}
]
},
"message": "To provide directions, I need your current location."
}

-If  giving user the navigation:
{
"ui": {
"requestLocation": false,
"actions": [
{
"type": "location-navigation",
"label": "Visit the link",
"a": "{{create a google map link from user coordinates and destination coordinates from listed location }}"
}
]
},
"message": "{{a meaningfull message.}}"
}

The assistant cannot access the user's GPS location directly.

Never return fake coordinates.
Never guess the user's location.




Listings:

${JSON.stringify(context, null, 2)}
`;

    /* ---------------------------
       Generate response
    ---------------------------- */

    const response =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: {type: "json_object"},
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },

          ...chatHistory,

          {
            role: "user",
            content: message,
          },
        ],
      });

const raw = response.choices[0]?.message?.content || ``;

const pares: {ui: any, message: string} = JSON.parse(raw)






if (pares?.ui) {
  // structured response
  return NextResponse.json({
    message: pares.message || "",
    ui: pares.ui,

  });
}

// fallback → plain text response
return NextResponse.json({
  message: pares.message,
  ui: null,
});








  } catch (error) {
    console.error(
      "CHAT API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   INTENT EXTRACTION
===================================================== */

async function extractIntent(
  message: string,
  conversation: any[] = []
) {

  
  try {
    const response =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: `
You are an intent classifier for a Maldives travel assistant.

Use BOTH:
- Current user message
- Previous conversation

Allowed categories:

${CATEGORIES}

Examples:

"Where can I stay?"
=> accommodation

"Best guesthouses?"
=> accommodation

"Where can I eat?"
=> restaurant

"Good coffee shop?"
=> restaurant

"Scuba diving?"
=> activity

"Snorkeling trips?"
=> activity

"Can i hire a buggy?"=> taxi-buggy-rental

"Rent a bike?"
=> rental

"Boat hire?"
=> rental

"Where is Bikini Beach?"
=> places

"What can I visit?"
=> places

Return ONLY JSON:

{
  "category": "",
  "subCategory": "all",
  "keywords": [],
  "goal": "",
  "confidence": 0
}

Rules:

- Understand meaning.
- Use conversation history.
- If user asks:
  "Which one is cheapest?"
  keep previous category.

- Keywords should be short.
- No markdown.
- No explanations.
- Always return what user is trying to find and set to goal, the best like "navigation" | "find_place" | "get_info" | "compare" | "greeting"


`,
          },

          ...conversation,

          {
            role: "user",
            content: message,
          },
        ],
      });

    const content =
      response.choices[0]?.message?.content;

    if (!content) {
      throw new Error(
        "Empty intent response"
      );
    }

    return JSON.parse(content);
  } catch (err) {
    console.error(
      "INTENT ERROR:",
      err
    );

    return {
      category: "all",
      subCategory: "all",
      keywords: [],
      confidence: 0,
    };
  }
}
