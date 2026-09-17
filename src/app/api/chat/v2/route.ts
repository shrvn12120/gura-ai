import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

import { vectorSearch } from "@/lib/vectorSearch";
import { SYSTEM_PROMPT } from "@/lib/aiPrompt";
import { logGeminiRequest } from "@/lib/logGeminiRequest";

/* =========================================================
   CONFIG
========================================================= */

export const MODEL = "gemini-3.8-flash";

const JEV_MODEL = "jev-latest";
const RAG_LIMIT = 4;

/* =========================================================
   GEMINI
========================================================= */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* =========================================================
   TYPES
========================================================= */

type ChatRequest = {
  message: string;
  interactionId?: string | null;
};

export type UsageStats = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

type JevChoice = {
  type?: string;
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
};

type JevResponse = {
  model?: string;
  answers?: {
    intent?: JevChoice;
    category?: JevChoice;
    date_time?: JevChoice;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

type RoutingResult = {
  intent: "casual" | "knowledge";
  category:
    | "guesthouse"
    | "restaurant"
    | "transport"
    | "activity"
    | "rental"
    | "beach"
    | "service"
    | "other";
  dateTime: "required" | "not_required";
};

/* =========================================================
   SYSTEM PROMPTS
========================================================= */

/*
 * Keep this intentionally small.
 *
 * This prompt is used only for casual conversations,
 * so we don't need to send the large RAG/system prompt.
 */
const CASUAL_SYSTEM_PROMPT = `
You are a friendly assistant for Explore Guraidhoo.

For casual conversation:
- Be brief, natural, and friendly.
- Respond directly to greetings, thanks, acknowledgements, farewells, and simple small talk.
- Do not search the knowledge base.
- Do not invent information about Guraidhoo.
- If the user asks for factual information, answer only if the information is provided in the conversation.
`.trim();

/* =========================================================
   JEV ROUTING QUESTIONS
========================================================= */

const ROUTING_QUESTIONS = {
  intent: {
    type: "choice",

    instructions:
      "Determine whether the user's message is casual conversation or requires information.",

    criteria: {
      casual:
        "Greetings, thanks, acknowledgements, farewells, date and time, or simple small talk that does not require factual information.",

      knowledge:
        "The user wants information, recommendations, places, services, activities, prices, availability, directions, or any factual information.",
    },
  },

  category: {
    type: "choice",

    instructions:
      "If the message requires information, identify the most relevant Guraidhoo knowledge category. If it does not clearly belong to one category, use other.",

    criteria: {
      guesthouse:
        "Accommodation, hotels, guesthouses, rooms, or places to stay.",

      restaurant: "Restaurants, cafes, food, meals, or dining.",

      transport:
        "Speedboats, ferries, transfers, transportation, or getting to or from places.",

      activity:
        "Activities, excursions, tours, things to do, experiences, snorkeling, diving, fishing, or similar.",

      rental:
        "Motorcycles, bicycles, buggies, scooters, cars, or other vehicle rentals.",

      beach:
        "Beaches, swimming areas, bikini beach, or beach-related information.",

      service:
        "Local services, shops, businesses, public services, or other services.",

      other:
        "Information that does not clearly belong to the other categories.",
    },
  },

  date_time: {
    type: "choice",

    instructions:
      "Determine whether answering the user's message requires the current date or current time.",

    criteria: {
      required:
        "The user asks what time or date it is, asks whether something is open or available now, or uses words such as now, today, tonight, this morning, this afternoon, tomorrow, or currently where the current date or time matters.",

      not_required:
        "The user's question can be answered without knowing the current date or time.",
    },
  },
} as const;

/* =========================================================
   JEV ROUTING
========================================================= */

async function routeWithJev(message: string): Promise<RoutingResult> {
  if (!process.env.JEV_API_URL) {
    throw new Error("JEV_API_URL is not configured.");
  }

  if (!process.env.JEV_API_KEY) {
    throw new Error("JEV_API_KEY is not configured.");
  }

  const response = await fetch(process.env.JEV_API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.JEV_API_KEY}`,
    },

    body: JSON.stringify({
      state: message,
      model: JEV_MODEL,
      questions: ROUTING_QUESTIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Jev request failed (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as JevResponse;

  const intent =
    result.answers?.intent?.choice === "casual" ? "casual" : "knowledge";

  const validCategories = [
    "guesthouse",
    "restaurant",
    "transport",
    "activity",
    "rental",
    "beach",
    "service",
    "other",
  ] as const;

  const rawCategory = result.answers?.category?.choice;

  const category = validCategories.includes(
    rawCategory as (typeof validCategories)[number],
  )
    ? (rawCategory as RoutingResult["category"])
    : "other";

  const dateTime =
    result.answers?.date_time?.choice === "required"
      ? "required"
      : "not_required";

  return {
    intent,
    category,
    dateTime,
  };
}

/* =========================================================
   MALDIVES DATE / TIME
========================================================= */

function getMaldivesDateTime() {
  const now = new Date();

  return {
    date: now.toLocaleDateString("en-MV", {
      timeZone: "Indian/Maldives",
      dateStyle: "full",
    }),

    time: now.toLocaleTimeString("en-MV", {
      timeZone: "Indian/Maldives",
      timeStyle: "short",
    }),

    timezone: "Indian/Maldives",
    utcOffset: "UTC+5",
  };
}

/* =========================================================
   CLEAN SEARCH RESULTS
========================================================= */
function cleanSearchResults(results: any[]) {
  return results.map((result) => {
  const contact = (result.contactInfo as Record<string, any>) || {};

  const cleanObject: Record<string, any> = {
    title: result.title,
    description: result.description,
  };

  // Only include optional scalar keys if they contain values
  if (contact.address) cleanObject.address = contact.address;

  // Images: Already pre-formatted as Markdown strings in vectorSearch()
  if (Array.isArray(result.images) && result.images.length > 0) {
    cleanObject.formatted_images = result.images.map((img: { alt: string; url: string }) => `![${img.alt}](${img.url})`)
  }

  // Formatted Phone
  if (contact.phone) {
    cleanObject.formatted_phone = `[${contact.phone}](tel:${contact.phone.replace(/\s+/g, "")})`;
  }

      if (contact.whatsapp) {
      cleanObject.whatsapp = contact.whatsapp;
    }

  // Formatted Email
  if (contact.email) {
    cleanObject.formatted_email = `[${contact.email}](mailto:${contact.email})`;
  }

  // Formatted Socials & Website Links
  if (Array.isArray(contact.socials) && contact.socials.length > 0) {
    const validSocials = contact.socials
      .filter((s: { link?: string }) => Boolean(s.link))
      .map((s: { link: string; name?: string }) => {
        const label = s.name ? s.name.charAt(0).toUpperCase() + s.name.slice(1) : "Website";
        return `[${label}](${s.link})`;
      });

    if (validSocials.length > 0) {
      cleanObject.formatted_socials = validSocials;
    }
  }

  // Formatted Google Maps Link
  if (contact.coordinates?.lat && contact.coordinates?.lng) {
    cleanObject.formatted_map_link = `[Show On Map](https://www.google.com/maps/search/?api=1&query=${contact.coordinates.lat},${contact.coordinates.lng})`;
  }
  cleanObject.metadata = result.metadata.toJSON ? result.metadata.toJSON() : result.metadata;

  return cleanObject;
});
}

/* =========================================================
   KNOWLEDGE CONTEXT
========================================================= */

function buildKnowledgeContext(results: any[]) {
  if (!results.length) {
    return "No relevant information was found in the knowledge base.";
  }

  const formatValue = (value: unknown): string | null => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    // Empty array
    if (Array.isArray(value) && value.length === 0) {
      return null;
    }

    // Empty object
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as object).length === 0
    ) {
      return null;
    }

    // Objects and arrays
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };
  const data = results
    .map((result, index) => {
      const fields = [
        ["Name", result.title],
        ["Description", result.description],
        ["Address", result.address],
        ["Phone", result.formatted_phone],
        ["WhatsApp", result.whatsapp],
        ["Email", result.formatted_email],
        ["Socials", result.socials],
        ["Map", result.formatted_map_link],
        ["Metadata", result.metadata],
        ["Images", result.formatted_images],
      ]
        .map(([label, value]) => {
          const formatted = formatValue(value);
          return formatted ? `${label}: ${formatted}` : null;
        })
        .filter(Boolean);

      return `[Knowledge Result ${index + 1}]\n${fields.join("\n")}`;
    })
    .join("\n\n");
  return data
}

/* =========================================================
   RAG
========================================================= */

async function getRAGContext(query: string) {
  try {
    /*
     * IMPORTANT:
     *
     * Always search using the original user query.
     *
     * The Jev category is routing metadata.
     * Do not replace the semantic query with:
     *
     * vectorSearch(category, RAG_LIMIT)
     *
     * because that would lose the user's actual intent.
     */
    const rawResults = await vectorSearch(query, RAG_LIMIT);

    const cleanedResults = cleanSearchResults(rawResults);


    return {
      query,

      results: cleanedResults,

      context: buildKnowledgeContext(cleanedResults),
    };
  } catch (error) {
    console.error("❌ Vector search execution failed:", error);

    return {
      query,

      results: [],

      context:
        "The knowledge base could not be searched. Do not invent information.",
    };
  }
}

/* =========================================================
   GEMINI USAGE
========================================================= */

function extractUsage(interaction: any): UsageStats {
  const usage = interaction?.usage;

  if (!usage) {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };
  }

  const inputTokens = Number(
    usage.total_input_tokens ?? usage.input_tokens ?? usage.prompt_tokens ?? 0,
  );

  const outputTokens = Number(
    usage.total_output_tokens ??
      usage.output_tokens ??
      usage.completion_tokens ??
      0,
  );

  const reportedTotal = Number(usage.total_tokens ?? 0);

  const totalTokens =
    reportedTotal > 0 ? reportedTotal : inputTokens + outputTokens;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

/* =========================================================
   SAFE CONVERSATION LOGGING
========================================================= */

async function safeLogConversation(params: {
  sessionId: string;
  userMessage: string;
  assistantResponse: string;
  usage: UsageStats;
  toolCalls: number;
  responseTimeMs: number;
  status: "completed" | "error";
  errorMessage?: string | null;
}) {
  try {
    console.time("logStart");
    await logGeminiRequest({
      sessionId: params.sessionId,
      userMessage: params.userMessage,
      assistantResponse: params.assistantResponse,
      usage: params.usage,
      toolCalls: params.toolCalls,
      responseTimeMs: params.responseTimeMs,
      status: params.status,
      errorMessage: params.errorMessage ?? null,
    });
    console.timeEnd("logStart");
  } catch (error) {
    console.error("❌ Failed to log Gemini request:", error);
  }
}

/* =========================================================
   JSON RESPONSE
========================================================= */

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/* =========================================================
   POST
========================================================= */

export async function POST(req: NextRequest) {
  /* -------------------------------------------------------
     SESSION
  ------------------------------------------------------- */

  const sessionId = req.cookies.get("session_id")?.value;

  /* -------------------------------------------------------
     CORS
  ------------------------------------------------------- */

  const requestOrigin = req.headers.get("origin");

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return jsonResponse(
      {
        error: "Origin not allowed.",
      },
      403,
    );
  }

  /* -------------------------------------------------------
     SESSION CHECK
  ------------------------------------------------------- */

  if (!sessionId) {
    return jsonResponse(
      {
        error: "Missing session. Please refresh the page.",
      },
      401,
    );
  }

  /* -------------------------------------------------------
     REQUEST BODY
  ------------------------------------------------------- */

  let body: ChatRequest;

  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return jsonResponse(
      {
        error: "Invalid JSON request.",
      },
      400,
    );
  }

  const message = body.message?.trim();

  const interactionId = body.interactionId?.trim() || undefined;

  if (!message) {
    return jsonResponse(
      {
        error: "Message is required.",
      },
      400,
    );
  }

  /* -------------------------------------------------------
     ENV CHECK
  ------------------------------------------------------- */

  if (!process.env.GEMINI_API_KEY) {
    return jsonResponse(
      {
        error: "GEMINI_API_KEY is not configured.",
      },
      500,
    );
  }

  /* -------------------------------------------------------
     STREAM
  ------------------------------------------------------- */

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (data: unknown) => {
        if (closed) return;

        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch (error) {
          console.error("Stream enqueue failed:", error);
        }
      };

      const close = () => {
        if (closed) return;

        closed = true;

        try {
          controller.close();
        } catch {}
      };

      /* -----------------------------------------------------
         REQUEST STATE
      ----------------------------------------------------- */

      const requestStart = Date.now();

      let previousInteractionId = interactionId;

      let finalAssistantResponse = "";

      let totalToolCalls = 0;

      const totalUsage: UsageStats = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };

      let routing: RoutingResult = {
        intent: "knowledge",
        category: "other",
        dateTime: "not_required",
      };

      try {
        /* ===================================================
           1. JEV ROUTING
        =================================================== */

        const jevStart = Date.now();

        routing = await routeWithJev(message);

        const jevTimeMs = Date.now() - jevStart;

        /* ===================================================
           2. CASUAL VS KNOWLEDGE
        =================================================== */

        let geminiInput = message;

        let dateTimeContext = "";

        /* ---------------------------------------------------
           LIVE DATE/TIME
        --------------------------------------------------- */

        if (routing.dateTime === "required") {
          const current = getMaldivesDateTime();

          dateTimeContext = `
Current date: ${current.date}
Current time: ${current.time}
Timezone: ${current.timezone}
UTC offset: ${current.utcOffset}
`.trim();
        }

        /* ---------------------------------------------------
           KNOWLEDGE REQUEST
        --------------------------------------------------- */

        if (routing.intent === "knowledge") {
          const rag = await getRAGContext(message);

          geminiInput = `
User question:
${message}

${dateTimeContext ? `${dateTimeContext}\n` : ""}

Knowledge Context:
${rag.context}
`.trim();
        }

        /* ===================================================
           3. SYSTEM PROMPT
        =================================================== */

        const systemInstruction =
          routing.intent === "casual" ? CASUAL_SYSTEM_PROMPT : SYSTEM_PROMPT;

        /* ===================================================
           4. GEMINI INTERACTION
        =================================================== */

        const geminiStart = Date.now();

        const interactionStream = await ai.interactions.create({
          model: MODEL,

          system_instruction: systemInstruction,

          ...(previousInteractionId
            ? {
                previous_interaction_id: previousInteractionId,
              }
            : {}),

          input: geminiInput,
          generation_config: {
            thinking_level: "low",
          },

          stream: true,
        });

        /* ===================================================
           5. GEMINI STREAM
        =================================================== */

        for await (const event of interactionStream) {
          const eventAny = event as any;

          /* -----------------------------------------------
             INTERACTION CREATED
          ----------------------------------------------- */

          if (eventAny.event_type === "interaction.created") {
            const createdInteraction = eventAny.interaction;

            if (createdInteraction?.id) {
              previousInteractionId = createdInteraction.id;
            }
          } else if (
            /* -----------------------------------------------
             TEXT DELTA
          ----------------------------------------------- */
            eventAny.event_type === "step.delta" &&
            eventAny.delta?.type === "text"
          ) {
            const text = eventAny.delta.text || "";

            if (text) {
              finalAssistantResponse += text;

              send({
                type: "text",
                delta: text,
              });
            }
          } else if (eventAny.event_type === "interaction.completed") {
            /* -----------------------------------------------
             COMPLETED
          ----------------------------------------------- */
            const completed = eventAny.interaction;

            if (completed?.id) {
              previousInteractionId = completed.id;
            }

            const usage = extractUsage(completed);

            totalUsage.inputTokens += usage.inputTokens;

            totalUsage.outputTokens += usage.outputTokens;

            totalUsage.totalTokens += usage.totalTokens;
          } else if (eventAny.event_type === "error") {
            /* -----------------------------------------------
             ERROR
          ----------------------------------------------- */
            throw new Error(
              eventAny.error?.message || "Gemini interaction failed.",
            );
          }
        }

        const geminiTimeMs = Date.now() - geminiStart;

        const responseTimeMs = Date.now() - requestStart;

        /* ===================================================
           6. LOG CONVERSATION
        =================================================== */

        safeLogConversation({
          sessionId,

          userMessage: message,

          assistantResponse: finalAssistantResponse,

          usage: totalUsage,

          toolCalls: totalToolCalls,

          responseTimeMs,

          status: "completed",
        });

        /* ===================================================
           7. DONE EVENT
        =================================================== */

        send({
          type: "done",

          sessionId,

          interactionId: previousInteractionId,

          usage: totalUsage,

          toolCalls: totalToolCalls,

          queryMode: routing.intent === "casual" ? "CHAT" : "RAG",

          intent: routing.intent,

          category: routing.category,

          dateTime: routing.dateTime,

          timings: {
            total: responseTimeMs,
            jev: jevTimeMs,
            gemini: geminiTimeMs,
          },
        });

        close();
      } catch (error) {
        console.error("❌ Chat request failed:", error);

        const responseTimeMs = Date.now() - requestStart;

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        /* ===================================================
           LOG ERROR
        =================================================== */

        safeLogConversation({
          sessionId,

          userMessage: message,

          assistantResponse: finalAssistantResponse,

          usage: totalUsage,

          toolCalls: totalToolCalls,

          responseTimeMs,

          status: "error",

          errorMessage,
        });

        /* ===================================================
           ERROR EVENT
        =================================================== */

        send({
          type: "error",

          message: errorMessage,
        });

        close();
      }
    },
  });

  /* =======================================================
     RESPONSE
  ======================================================= */

  return new Response(stream, {
    status: 200,

    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",

      "Cache-Control": "no-cache, no-transform",

      Connection: "keep-alive",

      "X-Accel-Buffering": "no",
    },
  });
}
