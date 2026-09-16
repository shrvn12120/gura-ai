// import { GoogleGenAI } from "@google/genai";
// import { NextRequest } from "next/server";
// import { vectorSearch } from "@/lib/vectorSearch";
// import { SYSTEM_PROMPT } from "@/lib/aiPrompt";
// import { searchGuraidhooTool } from "@/lib/geminiTools";
// import { logGeminiRequest } from "@/lib/logGeminiRequest";

// /* =========================================================
//    CONFIG
// ========================================================= */

// export const MODEL = "gemini-3.8-flash";

// const MAX_TOOL_LOOPS = 3;

// /* =========================================================
//    GEMINI
// ========================================================= */

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// /* =========================================================
//    TYPES
// ========================================================= */

// type ChatRequest = {
//   message: string;
//   interactionId?: string | null;
// };

// export type UsageStats = {
//   inputTokens: number;
//   outputTokens: number;
//   totalTokens: number;
// };

// type FunctionCall = {
//   id: string;
//   name: string;
//   arguments: string;
//   index?: number;
// };

// /* =========================================================
//    RESPONSE HELPERS
// ========================================================= */

// function jsonResponse(data: unknown, status = 200) {
//   return new Response(JSON.stringify(data), {
//     status,
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
// }

// /* =========================================================
//    CLEAN SEARCH RESULTS
// ========================================================= */

// function cleanSearchResults(results: any[]) {
//   return results.map((result) => {
//   const contact = (result.contactInfo as Record<string, any>) || {};

//   const cleanObject: Record<string, any> = {
//     id: result.id,
//     title: result.title,
//     description: result.description,
//   };

//   // Only include optional scalar keys if they contain values
//   if (result.category) cleanObject.category = result.category;
//   if (result.subCategory) cleanObject.subCategory = result.subCategory;
//   if (contact.address) cleanObject.address = contact.address;

//   // Images: Already pre-formatted as Markdown strings in vectorSearch()
//   if (Array.isArray(result.images) && result.images.length > 0) {
//     cleanObject.formatted_images = result.images.map((img: { alt: string; url: string }) => `![${img.alt}](${img.url})`)
//   }

//   // Formatted Phone
//   if (contact.phone) {
//     cleanObject.formatted_phone = `[${contact.phone}](tel:${contact.phone.replace(/\s+/g, "")})`;
//   }

//   // Formatted Email
//   if (contact.email) {
//     cleanObject.formatted_email = `[${contact.email}](mailto:${contact.email})`;
//   }

//   // Formatted Socials & Website Links
//   if (Array.isArray(contact.socials) && contact.socials.length > 0) {
//     const validSocials = contact.socials
//       .filter((s: { link?: string }) => Boolean(s.link))
//       .map((s: { link: string; name?: string }) => {
//         const label = s.name ? s.name.charAt(0).toUpperCase() + s.name.slice(1) : "Website";
//         return `[${label}](${s.link})`;
//       });

//     if (validSocials.length > 0) {
//       cleanObject.formatted_socials = validSocials;
//     }
//   }

//   // Formatted Google Maps Link
//   if (contact.coordinates?.lat && contact.coordinates?.lng) {
//     cleanObject.formatted_map_link = `[Show On Map](https://www.google.com/maps/search/?api=1&query=${contact.coordinates.lat},${contact.coordinates.lng})`;
//   }
//   cleanObject.metadata = result.metadata.toJSON ? result.metadata.toJSON() : result.metadata;

//   return cleanObject;
// });
// }

// /* =========================================================
//    TOOL EXECUTION
// ========================================================= */

// async function executeTool(toolCall: FunctionCall) {

//   if (toolCall.name === "search_guraidhoo") {
//     let args: { query?: string; limit?: number };

//     try {
//       args = JSON.parse(toolCall.arguments || "{}");
//     } catch (error) {
//       return { error: "Invalid search arguments." };
//     }

//     const query = String(args.query || "").trim();
//     const requestedLimit = Number(args.limit);
//     const limit = Number.isFinite(requestedLimit)
//       ? Math.min(Math.max(Math.floor(requestedLimit), 1), 10)
//       : 5;

//     if (!query) {
//       console.warn("⚠️ [DEBUG] Empty query passed to search_guraidhoo");
//       return { error: "Search query is required." };
//     }

//     try {

//       const rawResults = await vectorSearch(query, limit);
//       const cleaned = cleanSearchResults(rawResults);

//       return {
//         query,
//         results: cleaned,
//       };
//     } catch (error) {
//       console.error("❌ [DEBUG] Vector search execution failed:", error);
//       return {
//         query,
//         results: [],
//         error: "Unable to search the Guraidhoo database.",
//       };
//     }
//   }

//   console.error(`❌ [DEBUG] Unknown tool requested: ${toolCall.name}`);
//   return { error: `Unknown tool: ${toolCall.name}` };
// }

// /* =========================================================
//    USAGE EXTRACTION
// ========================================================= */

// function extractUsage(interaction: any): UsageStats {
//   const usage = interaction?.usage;

//   if (!usage) {
//     return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
//   }

//   const inputTokens = Number(
//     usage.total_input_tokens ?? usage.input_tokens ?? usage.prompt_tokens ?? 0
//   );

//   const outputTokens = Number(
//     usage.total_output_tokens ?? usage.output_tokens ?? usage.completion_tokens ?? 0
//   );

//   const reportedTotal = Number(usage.total_tokens ?? 0);
//   const totalTokens = reportedTotal > 0 ? reportedTotal : inputTokens + outputTokens;

//   return { inputTokens, outputTokens, totalTokens };
// }

// /* =========================================================
//    SAFE LOGGER
// ========================================================= */

// async function safeLogConversation(params: {
//   sessionId: string;
//   userMessage: string;
//   assistantResponse: string;
//   usage: UsageStats;
//   toolCalls: number;
//   responseTimeMs: number;
//   status: "completed" | "error";
//   errorMessage?: string | null;
// }) {
//   try {
//     await logGeminiRequest({
//       sessionId: params.sessionId,
//       userMessage: params.userMessage,
//       assistantResponse: params.assistantResponse,
//       usage: params.usage,
//       toolCalls: params.toolCalls,
//       responseTimeMs: params.responseTimeMs,
//       status: params.status,
//       errorMessage: params.errorMessage ?? null,
//     });
//   } catch (error) {
//     console.error("❌ Failed to log Gemini request:", error);
//   }
// }

// /* =========================================================
//    POST ROUTE
// ========================================================= */

// export async function POST(req: NextRequest) {
//   const sessionId = req.cookies.get("session_id")?.value;
//   const requestOrigin = req.headers.get("origin");

//   if(!requestOrigin || !process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()).includes(requestOrigin)) {
//     return jsonResponse({ error: "Origin not allowed." }, 403);
//   }

//   if (!sessionId) {
//     return jsonResponse({ error: "Missing session. Please refresh the page." }, 401);
//   }

//   let body: ChatRequest;
//   try {
//     body = (await req.json()) as ChatRequest;
//   } catch {
//     return jsonResponse({ error: "Invalid JSON request." }, 400);
//   }

//   const message = body.message?.trim();
//   const interactionId = body.interactionId?.trim() || undefined;

//   if (!message) {
//     return jsonResponse({ error: "Message is required." }, 400);
//   }

//   if (!process.env.GEMINI_API_KEY) {
//     return jsonResponse({ error: "GEMINI_API_KEY is not configured." }, 500);
//   }

//   const encoder = new TextEncoder();

//   const stream = new ReadableStream({
//     async start(controller) {
//       let closed = false;

//       const send = (data: unknown) => {
//         if (closed) return;
//         try {
//           controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
//         } catch (error) {
//           console.error("Stream enqueue failed:", error);
//         }
//       };

//       const close = () => {
//         if (closed) return;
//         closed = true;
//         try {
//           controller.close();
//         } catch {
//           // Already closed.
//         }
//       };

//       const requestStart = Date.now();
//       let previousInteractionId = interactionId;
//       let finalAssistantResponse = "";
//       let totalToolCalls = 0;

//       const totalUsage: UsageStats = {
//         inputTokens: 0,
//         outputTokens: 0,
//         totalTokens: 0,
//       };

//       let currentInput: any = message;

//       try {

//         /* =================================================
//            TOOL LOOP
//         ================================================= */

//         for (let toolLoop = 0; toolLoop <= MAX_TOOL_LOOPS; toolLoop++) {

//           const pendingToolCalls: FunctionCall[] = [];
//           const toolCallByIndex = new Map<number, FunctionCall>();
//           let currentInteractionId: string | undefined;

//           try {

//             const interactionStream = await ai.interactions.create({
//               model: MODEL,
//               system_instruction: SYSTEM_PROMPT,
//               tools: [searchGuraidhooTool],
//               ...(previousInteractionId
//                 ? { previous_interaction_id: previousInteractionId }
//                 : {}),
//               input: currentInput,
//               stream: true,
//             });

//             for await (const event of interactionStream) {
//               const eventAny = event as any;

//               if (eventAny.event_type === "interaction.created") {
//                 currentInteractionId = eventAny.interaction?.id;
//                 if (currentInteractionId) {
//                   previousInteractionId = currentInteractionId;
//                 }
//               } else if (
//                 eventAny.event_type === "step.start" &&
//                 eventAny.step?.type === "function_call"
//               ) {
//                 const step = eventAny.step;
//                 const index = Number(
//                   eventAny.index ?? step.index ?? pendingToolCalls.length
//                 );

//                 const call: FunctionCall = {
//                   id: step.id || "",
//                   name: step.name || "",
//                   arguments: "",
//                   index,
//                 };

//                 pendingToolCalls.push(call);
//                 toolCallByIndex.set(index, call);

//                 send({
//                   type: "tool_start",
//                   tool: call.name,
//                 });
//               } else if (
//                 eventAny.event_type === "step.delta" &&
//                 eventAny.delta?.type === "arguments_delta"
//               ) {
//                 const delta = eventAny.delta.arguments || "";
//                 const rawIndex = eventAny.index ?? eventAny.step?.index;
//                 const index = rawIndex !== undefined ? Number(rawIndex) : NaN;

//                 let call: FunctionCall | undefined;
//                 if (Number.isFinite(index)) {
//                   call = toolCallByIndex.get(index);
//                 }

//                 if (!call) {
//                   call = pendingToolCalls[pendingToolCalls.length - 1];
//                 }

//                 if (call && delta) {
//                   call.arguments += delta;
//                 }
//               } else if (
//                 eventAny.event_type === "step.delta" &&
//                 eventAny.delta?.type === "text"
//               ) {
//                 const text = eventAny.delta.text || "";
//                 if (text) {
//                   send({
//                     type: "text",
//                     delta: text,
//                   });
//                   finalAssistantResponse += text;
//                 }
//               } else if (eventAny.event_type === "interaction.completed") {
//                 const completed = eventAny.interaction;
//                 if (completed?.id) {
//                   previousInteractionId = completed.id;
//                 }

//                 const usage = extractUsage(completed);
//                 totalUsage.inputTokens += usage.inputTokens;
//                 totalUsage.outputTokens += usage.outputTokens;
//                 totalUsage.totalTokens += usage.totalTokens;
//               } else if (eventAny.event_type === "error") {
//                 throw new Error(
//                   eventAny.error?.message || "Gemini interaction failed."
//                 );
//               }
//             }

//             // No pending tool calls means Gemini provided the final answer
//             if (pendingToolCalls.length === 0) {

//               break;
//             }

//             totalToolCalls += pendingToolCalls.length;

//             /* =============================================
//                MAX TOOL LOOP BREAK
//             ============================================= */

//             if (toolLoop >= MAX_TOOL_LOOPS - 1) {
//               console.warn(`⚠️ [DEBUG] Hit MAX_TOOL_LOOPS limit! Halting tool execution.`);

//               const fallbackMsg = "I don't have that information in my knowledge base.";

//               send({
//                 type: "text",
//                 delta: fallbackMsg,
//               });

//               finalAssistantResponse = fallbackMsg;
//               break;
//             }

//             /* =============================================
//                EXECUTE TOOLS & PREPARE NEXT INPUT
//             ============================================= */

//             const functionResults: any[] = [];

//             for (const toolCall of pendingToolCalls) {
//               const toolResult = await executeTool(toolCall);

//               /* =========================================================
//                  CRITICAL FIX HERE:
//                  Pass `toolResult` directly as the result object.
//                  Do NOT wrap inside a `[{ type: "text", text: "..." }]` array!
//               ========================================================= */
//               functionResults.push({
//                 type: "function_result",
//                 name: toolCall.name,
//                 call_id: toolCall.id,
//                 result: toolResult, // Direct object!
//               });

//               send({
//                 type: "tool_end",
//                 tool: toolCall.name,
//               });
//             }

//             if (!previousInteractionId && currentInteractionId) {
//               previousInteractionId = currentInteractionId;
//             }

//             if (!previousInteractionId) {
//               throw new Error("Missing Gemini interaction ID after tool call.");
//             }

//             // Set currentInput for the next loop turn
//             currentInput = functionResults;
//           } catch (geminiError) {
//             throw geminiError;
//           }
//         }

//         const responseTimeMs = Date.now() - requestStart;

//         await safeLogConversation({
//           sessionId,
//           userMessage: message,
//           assistantResponse: finalAssistantResponse,
//           usage: totalUsage,
//           toolCalls: totalToolCalls,
//           responseTimeMs,
//           status: "completed",
//         });

//         send({
//           type: "done",
//           sessionId,
//           interactionId: previousInteractionId,
//           usage: totalUsage,
//           toolCalls: totalToolCalls,
//         });

//         close();
//       } catch (error) {
//         console.error("❌ [DEBUG] Chat request failed:", error);

//         const responseTimeMs = Date.now() - requestStart;
//         const errorMessage =
//           error instanceof Error ? error.message : String(error);

//         await safeLogConversation({
//           sessionId,
//           userMessage: message,
//           assistantResponse: finalAssistantResponse,
//           usage: totalUsage,
//           toolCalls: totalToolCalls,
//           responseTimeMs,
//           status: "error",
//           errorMessage,
//         });

//         send({
//           type: "error",
//           message: errorMessage,
//         });

//         close();
//       }
//     },
//   });

//   return new Response(stream, {
//     status: 200,
//     headers: {
//       "Content-Type": "application/x-ndjson; charset=utf-8",
//       "Cache-Control": "no-cache, no-transform",
//       Connection: "keep-alive",
//       "X-Accel-Buffering": "no",
//     },
//   });
// }

import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

import { vectorSearch } from "@/lib/vectorSearch";
import { SYSTEM_PROMPT } from "@/lib/aiPrompt";
import { logGeminiRequest } from "@/lib/logGeminiRequest";

/* =========================================================
   CONFIG
========================================================= */

export const MODEL = "gemini-3.8-flash";

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

type QueryMode = "CHAT" | "RAG";

/* =========================================================
   RESPONSE HELPERS
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
   QUERY CLASSIFICATION
========================================================= */

/**
 * Messages that clearly do NOT require Guraidhoo knowledge.
 *
 * These bypass vectorSearch completely.
 */
const CASUAL_PATTERNS = [
  /^(hi|hello|hey|hiya|heya)[!. ]*$/i,
  /^(thanks|thank you|thx|ty)[!. ]*$/i,
  /^(bye|goodbye|see you)[!. ]*$/i,
  /^(ok|okay|alright|sure)[!. ]*$/i,
  /^(good morning|good afternoon|good evening)[!. ]*$/i,
];

const CASUAL_PHRASES = [
  "how are you",
  "who are you",
  "what are you",
  "what can you do",
  "nice to meet you",
];

/**
 * Strong signals that the user is asking about
 * information stored in the Guraidhoo knowledge base.
 */
const RAG_KEYWORDS = [
  // Accommodation
  "hotel",
  "guesthouse",
  "guest house",
  "guest houses",
  "accommodation",
  "where to stay",
  "place to stay",
  "room",

  // Food
  "restaurant",
  "restaurants",
  "food",
  "eat",
  "eating",
  "cafe",
  "café",
  "breakfast",
  "lunch",
  "dinner",
  "meal",

  // Transport
  "speedboat",
  "speed boat",
  "boat",
  "ferry",
  "transfer",
  "airport",
  "transport",
  "taxi",

  // Activities
  "diving",
  "dive",
  "snorkeling",
  "snorkelling",
  "fishing",
  "excursion",
  "excursions",
  "tour",
  "tours",
  "activity",
  "activities",
  "surfing",
  "water sports",
  "watersports",

  // Rentals
  "rent",
  "rental",
  "rentals",
  "motorcycle",
  "motorbike",
  "bike",
  "bicycle",
  "buggy",

  // Places / services
  "beach",
  "bikini beach",
  "mosque",
  "hospital",
  "clinic",
  "pharmacy",
  "shop",
  "store",
  "attraction",
  "attractions",

  // Information
  "price",
  "prices",
  "cost",
  "how much",
  "where",
  "when",
  "contact",
  "phone",
  "whatsapp",
  "email",
  "address",
  "location",
  "map",
  "opening",
  "opening hours",
  "hours",
  "available",
  "availability",

  // Recommendations
  "best",
  "recommend",
  "recommendation",
  "recommendations",
  "suggest",
  "suggestion",
  "suggestions",
  "nearby",
  "near",
];

/**
 * Determines whether the query needs the knowledge base.
 *
 * Important:
 *
 * CHAT:
 *   Clearly conversational → no vector search.
 *
 * RAG:
 *   Everything else → vector search.
 *
 * This intentionally defaults ambiguous queries to RAG.
 * That's safer for your "never invent Guraidhoo facts" rule.
 */
function classifyQuery(message: string): QueryMode {
  const text = message.trim().toLowerCase();

  if (!text) {
    return "CHAT";
  }

  // Very obvious casual messages.
  if (CASUAL_PATTERNS.some((pattern) => pattern.test(text))) {
    return "CHAT";
  }

  // Common conversational phrases.
  if (CASUAL_PHRASES.some((phrase) => text.includes(phrase))) {
    return "CHAT";
  }

  // Everything else is considered knowledge-related.
  //
  // We intentionally don't use:
  //
  //   return RAG_KEYWORDS.some(...)
  //
  // as the final decision because queries such as:
  //
  //   "What's good tonight?"
  //   "Any recommendations?"
  //
  // may still require the Guraidhoo knowledge base.
  //
  // Keyword matching is therefore used only as an explicit
  // signal, while ambiguous queries safely fall back to RAG.

  const hasRagKeyword = RAG_KEYWORDS.some((keyword) => text.includes(keyword));

  if (hasRagKeyword) {
    return "RAG";
  }

  // Safe default for a local knowledge assistant.
  return "RAG";
}

/* =========================================================
   CLEAN SEARCH RESULTS
========================================================= */

/**
 * Keep the RAG context relatively small.
 *
 * Presentation-specific markdown such as images, tel links,
 * mailto links and Google Maps links is intentionally omitted
 * from the model context.
 *
 * The frontend can handle presentation separately.
 */
function cleanSearchResults(results: any[]) {
  return results.map((result) => {
    const contact = (result.contactInfo as Record<string, any>) || {};

    const cleanObject: Record<string, any> = {
      id: result.id,
      title: result.title,
      description: result.description,
    };

    if (result.category) {
      cleanObject.category = result.category;
    }

    if (result.subCategory) {
      cleanObject.subCategory = result.subCategory;
    }

    if (contact.address) {
      cleanObject.address = contact.address;
    }

    if (contact.phone) {
      cleanObject.phone = contact.phone;
    }

    if (contact.email) {
      cleanObject.email = contact.email;
    }

    if (contact.whatsapp) {
      cleanObject.whatsapp = contact.whatsapp;
    }

    if (Array.isArray(contact.socials) && contact.socials.length > 0) {
      const socials = contact.socials
        .filter((social: { link?: string }) => Boolean(social.link))
        .map((social: { link: string; name?: string }) => ({
          name: social.name || "Website",
          link: social.link,
        }));

      if (socials.length > 0) {
        cleanObject.socials = socials;
      }
    }

    if (contact.coordinates?.lat && contact.coordinates?.lng) {
      cleanObject.coordinates = {
        lat: contact.coordinates.lat,
        lng: contact.coordinates.lng,
      };
    }

    if (result.metadata) {
      cleanObject.metadata = result.metadata.toJSON
        ? result.metadata.toJSON()
        : result.metadata;
    }

    return cleanObject;
  });
}

/* =========================================================
   RAG CONTEXT
========================================================= */

function buildKnowledgeContext(results: any[]) {
  if (!results.length) {
    return "No relevant information was found in the knowledge base.";
  }

  return results
    .map((result, index) => {
      return `
[Knowledge Result ${index + 1}]
ID: ${result.id}
Name: ${result.title || ""}
Category: ${result.category || ""}
Subcategory: ${result.subCategory || ""}
Description: ${result.description || ""}
Address: ${result.address || ""}
Phone: ${result.phone || ""}
WhatsApp: ${result.whatsapp || ""}
Email: ${result.email || ""}
Socials: ${JSON.stringify(result.socials || [])}
Coordinates: ${JSON.stringify(result.coordinates || null)}
Metadata: ${JSON.stringify(result.metadata || {})}
`;
    })
    .join("\n");
}

/* =========================================================
   VECTOR SEARCH
========================================================= */

async function getRAGContext(query: string) {
  try {
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
   USAGE EXTRACTION
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
   SAFE LOGGER
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
  } catch (error) {
    console.error("❌ Failed to log Gemini request:", error);
  }
}

/* =========================================================
   POST ROUTE
========================================================= */

export async function POST(req: NextRequest) {
  /* =======================================================
     REQUEST VALIDATION
  ======================================================= */

  const sessionId = req.cookies.get("session_id")?.value;

  const requestOrigin = req.headers.get("origin");

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return jsonResponse({ error: "Origin not allowed." }, 403);
  }

  if (!sessionId) {
    return jsonResponse(
      {
        error: "Missing session. Please refresh the page.",
      },
      401,
    );
  }

  /* =======================================================
     PARSE BODY
  ======================================================= */

  let body: ChatRequest;

  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return jsonResponse({ error: "Invalid JSON request." }, 400);
  }

  const message = body.message?.trim();

  const interactionId = body.interactionId?.trim() || undefined;

  if (!message) {
    return jsonResponse({ error: "Message is required." }, 400);
  }

  if (!process.env.GEMINI_API_KEY) {
    return jsonResponse(
      {
        error: "GEMINI_API_KEY is not configured.",
      },
      500,
    );
  }

  /* =======================================================
     NDJSON STREAM
  ======================================================= */

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = (data: unknown) => {
        if (closed) {
          return;
        }

        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch (error) {
          console.error("Stream enqueue failed:", error);
        }
      };

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;

        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };

      /* =====================================================
         REQUEST STATE
      ===================================================== */

      const requestStart = Date.now();

      let previousInteractionId = interactionId;

      let finalAssistantResponse = "";

      /**
       * Kept for compatibility with your existing
       * conversation logging.
       *
       * There are no Gemini function/tool calls
       * anymore, so this will normally be 0.
       */
      let totalToolCalls = 0;

      const totalUsage: UsageStats = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };

      try {
        /* ===================================================
           FAST QUERY CLASSIFICATION
        =================================================== */

        const queryMode = classifyQuery(message);

        /* ===================================================
           RAG
        =================================================== */

        let geminiInput: string = message;

        if (queryMode === "RAG") {
          const rag = await getRAGContext(message);

          /**
           * Send the knowledge context directly to Gemini.
           *
           * No function calling.
           * No second Gemini interaction.
           */
          geminiInput = `
User question:
${message}

Knowledge Context:
${rag.context}
`;
        }

        /* ===================================================
           GEMINI
        =================================================== */

        const interactionStream = await ai.interactions.create({
          model: MODEL,

          system_instruction: SYSTEM_PROMPT,

          ...(previousInteractionId
            ? {
                previous_interaction_id: previousInteractionId,
              }
            : {}),

          input: geminiInput,

          stream: true,
        });

        /* ===================================================
           GEMINI STREAM
        =================================================== */

        for await (const event of interactionStream) {
          const eventAny = event as any;

          /* -------------------------------------------------
             INTERACTION CREATED
          ------------------------------------------------- */

          if (eventAny.event_type === "interaction.created") {
            const createdInteraction = eventAny.interaction;

            if (createdInteraction?.id) {
              previousInteractionId = createdInteraction.id;
            }
          } else if (

          /* -------------------------------------------------
             TEXT DELTA
          ------------------------------------------------- */
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

          /* -------------------------------------------------
             INTERACTION COMPLETED
          ------------------------------------------------- */
            const completed = eventAny.interaction;

            if (completed?.id) {
              previousInteractionId = completed.id;
            }

            const usage = extractUsage(completed);

            totalUsage.inputTokens += usage.inputTokens;

            totalUsage.outputTokens += usage.outputTokens;

            totalUsage.totalTokens += usage.totalTokens;
          } else if (eventAny.event_type === "error") {

          /* -------------------------------------------------
             ERROR
          ------------------------------------------------- */
            throw new Error(
              eventAny.error?.message || "Gemini interaction failed.",
            );
          }
        }

        /* ===================================================
           COMPLETE
        =================================================== */

        const responseTimeMs = Date.now() - requestStart;

        await safeLogConversation({
          sessionId,
          userMessage: message,
          assistantResponse: finalAssistantResponse,
          usage: totalUsage,
          toolCalls: totalToolCalls,
          responseTimeMs,
          status: "completed",
        });

        send({
          type: "done",
          sessionId,
          interactionId: previousInteractionId,
          usage: totalUsage,
          toolCalls: totalToolCalls,
          queryMode,
        });

        close();
      } catch (error) {
        console.error("❌ Chat request failed:", error);

        const responseTimeMs = Date.now() - requestStart;

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        await safeLogConversation({
          sessionId,
          userMessage: message,
          assistantResponse: finalAssistantResponse,
          usage: totalUsage,
          toolCalls: totalToolCalls,
          responseTimeMs,
          status: "error",
          errorMessage,
        });

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
