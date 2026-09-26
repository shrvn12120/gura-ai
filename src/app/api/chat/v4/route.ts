// import { GoogleGenAI } from "@google/genai";
// import OpenAI from "openai";
// import { NextRequest } from "next/server";

// import { vectorSearch } from "@/lib/vectorSearch";
// import { SYSTEM_PROMPT } from "@/lib/aiPrompt";
// import { logGeminiRequest } from "@/lib/logGeminiRequest";
// import { DateTimeRequirement, Intent, jevRetrieve, Language, routeWithJev, RoutingResult } from "@/lib/jevUtils";

// const CASUAL_SYSTEM_PROMPT = `
// You are a friendly assistant for Explore Guraidhoo.

// For casual conversation:
// - Be brief, natural, and friendly.
// - Respond directly to greetings, thanks, acknowledgements, farewells, and simple small talk.
// - Do not search the knowledge base.
// - Do not invent information about Guraidhoo.
// - If the user asks for factual information, answer only if the information is provided in the conversation.
// `.trim();

// const GEMINI_MODEL = "gemini-3.8-flash";
// const OPENAI_MODEL = "gpt-5.6-luna";

// const RAG_LIMIT = 10;

// const googleAI = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// const openAI = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// /* -------------------------------------------------------------------------- */
// /* Helpers                                                                    */
// /* -------------------------------------------------------------------------- */

// function cleanSearchResults(results: any[]) {
//   return results.map((result) => {
//     const contact = (result.contactInfo as Record<string, any>) || {};
//     const cleanObject: Record<string, any> = {
//       title: result.title,
//       description: result.description,
//     };

//     if (contact.address) cleanObject.address = contact.address;

//     if (Array.isArray(result.images) && result.images.length > 0) {
//       cleanObject.formatted_images = result.images.map(
//         (img: { alt: string; url: string }) => `![${img.alt}](${img.url})`,
//       );
//     }

//     if (contact.phone) {
//       cleanObject.formatted_phone = `[${contact.phone}](tel:${contact.phone.replace(/\s+/g, "")})`;
//     }

//     if (contact.whatsapp) cleanObject.whatsapp = contact.whatsapp;
//     if (contact.email)
//       cleanObject.formatted_email = `[${contact.email}](mailto:${contact.email})`;

//     if (Array.isArray(contact.socials) && contact.socials.length > 0) {
//       const validSocials = contact.socials
//         .filter((s: { link?: string }) => Boolean(s.link))
//         .map((s: { link: string; name?: string }) => {
//           const label = s.name
//             ? s.name.charAt(0).toUpperCase() + s.name.slice(1)
//             : "Website";
//           return `[${label}](${s.link})`;
//         });

//       if (validSocials.length > 0) cleanObject.formatted_socials = validSocials;
//     }

//     const { lat, lng } = contact.coordinates || {};
//     if (
//       typeof lat === "number" &&
//       typeof lng === "number" &&
//       !(lat === 0 && lng === 0)
//     ) {
//       cleanObject.formatted_map_link = `[Show On Map](https://www.google.com/maps/search/?api=1&query=${lat},${lng})`;
//     }

//     cleanObject.metadata = result.metadata?.toJSON
//       ? result.metadata.toJSON()
//       : result.metadata;

//     return cleanObject;
//   });
// }

// function buildKnowledgeContext(results: any[]): string {
//   if (!results.length) {
//     return "No relevant information was found in the knowledge base.";
//   }

//   const formatValue = (value: unknown): string | null => {
//     if (value === undefined || value === null || value === "") return null;
//     if (Array.isArray(value) && value.length === 0) return null;
//     if (
//       typeof value === "object" &&
//       !Array.isArray(value) &&
//       Object.keys(value as object).length === 0
//     )
//       return null;
//     return typeof value === "object" ? JSON.stringify(value) : String(value);
//   };

//   return results
//     .map((result, index) => {
//       const fields = [
        // ["Name", result.title],
        // ["Description", result.description],
        // ["Address", result.address],
        // ["Phone", result.formatted_phone],
        // ["WhatsApp", result.whatsapp],
        // ["Email", result.formatted_email],
        // ["Socials", result.formatted_socials],
        // ["Map", result.formatted_map_link],
        // ["Metadata", result.metadata],
        // ["Images", result.formatted_images],
//       ]
//         .map(([label, value]) => {
//           const formatted = formatValue(value);
//           return formatted ? `${label}: ${formatted}` : null;
//         })
//         .filter(Boolean);

//       return `[Knowledge Result ${index + 1}]\n${fields.join("\n")}`;
//     })
//     .join("\n\n");
// }

// function getMaldivesDateTime() {
//   const now = new Date();
//   const date = now.toLocaleDateString("en-MV", {
//     timeZone: "Indian/Maldives",
//     dateStyle: "full",
//   });

//   const time = now.toLocaleTimeString("en-MV", {
//     timeZone: "Indian/Maldives",
//     timeStyle: "short",
//   });

//   return { date, time };
// }

// async function getRAGContext(query: string): Promise<string> {
//   try {
//     const searchResults = await vectorSearch(query, RAG_LIMIT);

//     if (!searchResults.length) {
//       return "No relevant information was found in the knowledge base.";
//     }
//     const rankedResults = await jevRetrieve(query, searchResults);
//     const cleanedResults = cleanSearchResults(rankedResults);

//     return buildKnowledgeContext(cleanedResults);
//   } catch (error) {
//     console.error("❌ RAG error:", error);
//     return "The knowledge base could not be searched. Do not invent information.";
//   }
// }

// async function safeLogConversation(params: {
//   sessionId: string;
//   model: string;
//   userMessage: string;
//   assistantResponse: string;
//   usage?: {
//     inputTokens?: number;
//     outputTokens?: number;
//     totalTokens?: number;
//   };
//   responseTimeMs: number;
//   status: "completed" | "error";
//   errorMessage?: string;
//   provider: "gemini" | "openai";
//   routing: RoutingResult;
//   conversationId?: string;
//   interactionId?: string;
// }) {
//   try {
//     await logGeminiRequest({
//       sessionId: params.sessionId,
//       model: params.model,
//       userMessage: params.userMessage,
//       assistantResponse: params.assistantResponse,
//       usage: {
//         inputTokens: params.usage?.inputTokens ?? 0,
//         outputTokens: params.usage?.outputTokens ?? 0,
//         totalTokens: params.usage?.totalTokens ?? 0,
//       },
//       toolCalls: 0,
//       responseTimeMs: params.responseTimeMs,
//       status: params.status,
//       errorMessage: params.errorMessage,
//     });
//   } catch (error) {
//     console.error("❌ Failed to log AI request:", error);
//   }
// }

// /* -------------------------------------------------------------------------- */
// /* Streaming Helpers                                                          */
// /* -------------------------------------------------------------------------- */

// async function streamOpenAI(params: {
//   message: string;
//   systemInstruction: string;
//   conversationId?: string;
//   onText: (text: string) => void;
// }) {
//   const existingConversationId = params.conversationId?.trim() || undefined;
//   const conversationToUse =
//     existingConversationId ?? (await openAI.conversations.create()).id;

//   const responseStream = await openAI.responses.create({
//     model: OPENAI_MODEL,
//     instructions: params.systemInstruction,
//     input: params.message,
//     conversation: conversationToUse,
//     reasoning: {
//       effort: "low",
//     },
//     stream: true,
//   });

//   let fullText = "";
//   let modelUsed = OPENAI_MODEL;
//   let usage:
//     | {
//         inputTokens: number;
//         outputTokens: number;
//         totalTokens: number;
//       }
//     | undefined;

//   let conversationId = existingConversationId ?? conversationToUse;

//   for await (const event of responseStream) {
//     if (event.type === "response.output_text.delta") {
//       const text = event.delta;
//       if (text) {
//         fullText += text;
//         params.onText(text);
//       }
//     }

//     if (event.type === "response.completed") {
//       const completedResponse = event.response;
//       modelUsed = completedResponse.model || OPENAI_MODEL;
//       conversationId = completedResponse.conversation?.id ?? conversationId;

//       if (completedResponse.usage) {
//         usage = {
//           inputTokens: completedResponse.usage.input_tokens ?? 0,
//           outputTokens: completedResponse.usage.output_tokens ?? 0,
//           totalTokens: completedResponse.usage.total_tokens ?? 0,
//         };
//       }
//     }
//   }

//   return {
//     fullText,
//     usage,
//     conversationId,
//     model: modelUsed,
//   };
// }

// async function streamGemini(params: {
//   message: string;
//   systemInstruction: string;
//   onText: (text: string) => void;
// }) {
//   const interactionStream = await googleAI.interactions.create({
//     model: GEMINI_MODEL,
//     system_instruction: params.systemInstruction,
//     input: params.message,
//     generation_config: {
//       thinking_level: "low",
//     },
//     stream: true,
//   });

//   let fullText = "";
//   let modelUsed = GEMINI_MODEL;
//   let interactionId: string | undefined;
//   let usage:
//     | {
//         inputTokens: number;
//         outputTokens: number;
//         totalTokens: number;
//       }
//     | undefined;

//   for await (const event of interactionStream) {
//     if (event.event_type === "step.delta" && event.delta?.type === "text") {
//       const text = event.delta.text ?? "";
//       if (text) {
//         fullText += text;
//         params.onText(text);
//       }
//     }

//     if (event.event_type === "interaction.completed") {
//       const interaction = event.interaction;
//       modelUsed = interaction?.model || GEMINI_MODEL;
//       interactionId = interaction?.id;

//       if (interaction?.usage) {
//         usage = {
//           inputTokens: interaction.usage.total_input_tokens ?? 0,
//           outputTokens: interaction.usage.total_output_tokens ?? 0,
//           totalTokens: interaction.usage.total_tokens ?? 0,
//         };
//       }
//     }
//   }

//   return {
//     fullText,
//     usage,
//     interactionId,
//     model: modelUsed,
//   };
// }

// /* -------------------------------------------------------------------------- */
// /* POST Handler                                                               */
// /* -------------------------------------------------------------------------- */

// export async function POST(req: NextRequest) {
//   const startTime = Date.now();
//   const sessionId = req.cookies.get("session_id")?.value ?? "";

//   const requestOrigin = req.headers.get("origin");
//   const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
//     .split(",")
//     .map((origin) => origin.trim())
//     .filter(Boolean);

//   if (
//     requestOrigin &&
//     allowedOrigins.length > 0 &&
//     !allowedOrigins.includes(requestOrigin)
//   ) {
//     return new Response("Forbidden", { status: 403 });
//   }

//   let body: {
//     message?: string;
//     conversationId?: string;
//     intent?: {
//       intent: Intent;
//       dateTime: DateTimeRequirement;
//       lang: Language;
//     } | null;
//   };

//   try {
//     body = await req.json();
//   } catch {
//     return new Response("Invalid JSON", { status: 400 });
//   }

//   const message = body.message?.trim();
//   if (!message) {
//     return new Response("Message is required", { status: 400 });
//   }

//   const encoder = new TextEncoder();

//   // Helper to send NDJSON frame
//   const sendNDJSON = (
//     controller: ReadableStreamDefaultController,
//     data: Record<string, any>,
//   ) => {
//     controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
//   };

//   const stream = new ReadableStream({
//     async start(controller) {
//       let fullResponseText = "";
//       let activeRouting: RoutingResult = {
//         intent: "knowledge",
//         dateTime: "not_required",
//         lang: "major",
//       };
//       let provider: "gemini" | "openai" = "openai";

//       try {
//         const routing = !body.intent ? await routeWithJev(message) : body.intent;
//         activeRouting = routing;

//         let dateTimeContext = "";
//         if (routing.dateTime === "required") {
//           const { date, time } = getMaldivesDateTime();
//           dateTimeContext = `\nCURRENT MALDIVES DATE AND TIME\nDate: ${date}\nTime: ${time}\n`;
//         }

//         let knowledgeContext = "";
//         if (routing.intent === "knowledge") {
//           knowledgeContext = await getRAGContext(message);
//         }

//         const baseSystemPrompt =
//           routing.intent === "casual" ? CASUAL_SYSTEM_PROMPT : SYSTEM_PROMPT;

//         const systemInstruction = `
// ${baseSystemPrompt}

// ${dateTimeContext}

// ${
//   routing.intent === "knowledge"
//     ? `
// KNOWLEDGE CONTEXT

// Use ONLY the information provided below when answering factual
// questions about Guraidhoo.

// Do not invent businesses, prices, locations, contact information,
// opening hours, availability, activities, or other facts.

// If the requested information is not available in the knowledge
// context, clearly say that the information is not available.

// ${knowledgeContext}
// `
//     : ""
// }

// Keep responses concise and useful.
// `;

//         provider = routing.lang === "dhivehi" ? "gemini" : "openai";

//         if (provider === "gemini") {
//           const result = await streamGemini({
//             message,
//             systemInstruction,
//             onText(text) {
//               fullResponseText += text;
//               sendNDJSON(controller, { type: "text", text });
//             },
//           });

//           // Send final metadata chunk
//           sendNDJSON(controller, {
//             type: "metadata",
//             interactionId: result.interactionId,
//             model: result.model,
//             provider: "gemini",
//           });

//           await safeLogConversation({
//             sessionId,
//             model: result.model,
//             userMessage: message,
//             assistantResponse: fullResponseText,
//             usage: result.usage,
//             responseTimeMs: Date.now() - startTime,
//             status: "completed",
//             provider: "gemini",
//             routing,
//             interactionId: result.interactionId,
//           });
//         } else {
//           const result = await streamOpenAI({
//             message,
//             systemInstruction,
//             conversationId: body.conversationId,
//             onText(text) {
//               fullResponseText += text;
//               sendNDJSON(controller, { type: "text", text });
//             },
//           });

//           // Send final metadata chunk
//           sendNDJSON(controller, {
//             type: "metadata",
//             conversationId: result.conversationId,
//             model: result.model,
//             provider: "openai",
//           });

//           await safeLogConversation({
//             sessionId,
//             model: result.model,
//             userMessage: message,
//             assistantResponse: fullResponseText,
//             usage: result.usage,
//             responseTimeMs: Date.now() - startTime,
//             status: "completed",
//             provider: "openai",
//             routing,
//             conversationId: result.conversationId,
//           });
//         }

//         controller.close();
//       } catch (error) {
//         console.error("❌ Streaming Error:", error);
//         const errorMessage =
//           error instanceof Error ? error.message : "Unknown error";

//         sendNDJSON(controller, { type: "error", error: errorMessage });
//         controller.error(error);

//         await safeLogConversation({
//           sessionId,
//           model: provider === "gemini" ? GEMINI_MODEL : OPENAI_MODEL,
//           userMessage: message,
//           assistantResponse: fullResponseText,
//           responseTimeMs: Date.now() - startTime,
//           status: "error",
//           errorMessage,
//           provider,
//           routing: activeRouting,
//         });
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
import OpenAI from "openai";
import { NextRequest } from "next/server";

import { vectorSearch } from "@/lib/vectorSearch";
import { CASUAL_SYSTEM_PROMPT, SYSTEM_PROMPT } from "@/lib/aiPrompt";
import { logGeminiRequest } from "@/lib/logGeminiRequest";
import {
  DateTimeRequirement,
  Intent,
  jevRetrieve,
  Language,
  routeWithJev,
  RoutingResult,
} from "@/lib/jevUtils";



const GEMINI_MODEL = "gemini-3.7-flash";
const OPENAI_MODEL = "gpt-5.6-luna";
const RAG_LIMIT = 10;

const googleAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------------------------------------------- */
/* RAG Helpers                                                                */
/* -------------------------------------------------------------------------- */

function cleanSearchResults(results: any[]) {
  return results.map((result) => {
    const contact = (result.contactInfo as Record<string, any>) || {};
    const cleanObject: Record<string, any> = {
      title: result.title,
      description: result.description,
    };

    if (contact.address) cleanObject.address = contact.address;

    if (Array.isArray(result.images) && result.images.length > 0) {
      cleanObject.formatted_images = result.images.map(
        (img: { alt: string; url: string }) => `![${img.alt}](${img.url})`,
      );
    }

    if (contact.phone) {
      cleanObject.formatted_phone = `[${contact.phone}](tel:${contact.phone.replace(/\s+/g, "")})`;
    }

    if (contact.whatsapp) cleanObject.whatsapp = contact.whatsapp;
    if (contact.email)
      cleanObject.formatted_email = `[${contact.email}](mailto:${contact.email})`;

    if (Array.isArray(contact.socials) && contact.socials.length > 0) {
      const validSocials = contact.socials
        .filter((s: { link?: string }) => Boolean(s.link))
        .map((s: { link: string; name?: string }) => {
          const label = s.name
            ? s.name.charAt(0).toUpperCase() + s.name.slice(1)
            : "Website";
          return `[${label}](${s.link})`;
        });

      if (validSocials.length > 0) cleanObject.formatted_socials = validSocials;
    }

    const { lat, lng } = contact.coordinates || {};
    if (
      typeof Number(lat) === "number" &&
      typeof Number(lng) === "number" &&
      !(lat === 0 && lng === 0)
    ) {
      cleanObject.formatted_map_link = `[Show On Map](https://www.google.com/maps/search/?api=1&query=${lat},${lng})`;

   cleanObject.formatted_direction_link = `[Direction to ${result.title}](https://www.google.com/maps/dir/?api=1` +
  `&destination=${encodeURIComponent(`${lat},${lng}`)}` +
  `&travelmode=walking` +
  `&dir_action=navigate&basemap=satellite)`;
    };
    
    cleanObject.metadata = result.metadata?.toJSON
      ? result.metadata.toJSON()
      : result.metadata;
    return cleanObject;
  });
}

function buildKnowledgeContext(results: any[]): string {

  if (!results.length) {
    return "No relevant information was found in the knowledge base.";
  }

  const formatValue = (value: unknown): string | null => {
    if (value === undefined || value === null || value === "") return null;
    if (Array.isArray(value) && value.length === 0) return null;
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as object).length === 0
    ) {
      return null;
    }
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  };

  return results
    .map((result, index) => {
      const fields = [
        ["Name", result.title],
        ["Description", result.description],
        ["Address", result.address],
        ["Phone", result.formatted_phone],
        ["WhatsApp", result.whatsapp],
        ["Email", result.formatted_email],
        ["Socials", result.formatted_socials],
        ["Map", result.formatted_map_link],
        ["Direction", result.formatted_direction_link],
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
}

function getMaldivesDateTime() {
  const now = new Date();
  const date = now.toLocaleDateString("en-MV", {
    timeZone: "Indian/Maldives",
    dateStyle: "full",
  });

  const time = now.toLocaleTimeString("en-MV", {
    timeZone: "Indian/Maldives",
    timeStyle: "short",
  });

  return { date, time };
}

async function getRAGContext(query: string): Promise<string> {
  try {
    const searchResults = await vectorSearch(query, RAG_LIMIT);

    if (!searchResults.length) {
      return "No relevant information was found in the knowledge base.";
    }
    const rankedResults = await jevRetrieve(query, searchResults);
    const cleanedResults = cleanSearchResults(rankedResults);


    return buildKnowledgeContext(cleanedResults);
  } catch (error) {
    console.error("❌ RAG error:", error);
    return "The knowledge base could not be searched. Do not invent information.";
  }
}

async function safeLogConversation(params: {
  sessionId: string;
  model: string;
  userMessage: string;
  assistantResponse: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  responseTimeMs: number;
  status: "completed" | "error";
  errorMessage?: string;
  provider: "gemini" | "openai";
  routing: RoutingResult;
  conversationId?: string;
  interactionId?: string;
}) {
  try {
    await logGeminiRequest({
      sessionId: params.sessionId,
      model: params.model,
      userMessage: params.userMessage,
      assistantResponse: params.assistantResponse,
      usage: {
        inputTokens: params.usage?.inputTokens ?? 0,
        outputTokens: params.usage?.outputTokens ?? 0,
        totalTokens: params.usage?.totalTokens ?? 0,
      },
      toolCalls: 0,
      responseTimeMs: params.responseTimeMs,
      status: params.status,
      errorMessage: params.errorMessage,
    });
  } catch (error) {
    console.error("❌ Failed to log AI request:", error);
  }
}

/* -------------------------------------------------------------------------- */
/* Streaming Services                                                         */
/* -------------------------------------------------------------------------- */

async function streamOpenAI(params: {
  message: string;
  systemInstruction: string;
  conversationId?: string;
  onText: (text: string) => void;
}) {
  const existingConversationId = params.conversationId?.trim() || undefined;
  const conversationToUse =
    existingConversationId ?? (await openAI.conversations.create()).id;

  const responseStream = await openAI.responses.create({
    model: OPENAI_MODEL,
    instructions: params.systemInstruction,
    input: params.message,
    conversation: conversationToUse,
    reasoning: {
      effort: "low",
    },
    stream: true,
  });

  let fullText = "";
  let modelUsed = OPENAI_MODEL;
  let usage:
    | {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
      }
    | undefined;

  let conversationId = existingConversationId ?? conversationToUse;

  for await (const event of responseStream) {
    if (event.type === "response.output_text.delta") {
      const text = event.delta;
      if (text) {
        fullText += text;
        params.onText(text);
      }
    }

    if (event.type === "response.completed") {
      const completedResponse = event.response;
      modelUsed = completedResponse.model || OPENAI_MODEL;
      conversationId = completedResponse.conversation?.id ?? conversationId;

      if (completedResponse.usage) {
        usage = {
          inputTokens: completedResponse.usage.input_tokens ?? 0,
          outputTokens: completedResponse.usage.output_tokens ?? 0,
          totalTokens: completedResponse.usage.total_tokens ?? 0,
        };
      }
    }
  }

  return {
    fullText,
    usage,
    conversationId,
    model: modelUsed,
  };
}

async function streamGemini(params: {
  message: string;
  systemInstruction: string;
  interactionId?: string;
  onText: (text: string) => void;
}) {
  const interactionStream = await googleAI.interactions.create({
    model: GEMINI_MODEL,
    system_instruction: `${params.systemInstruction} translate everything to dhivehi, if user speak in dhivehi latin response in latin, if user speak in dhivehi thaana response in thaana`,
    input: params.message,
    ...(params.interactionId ? { previous_interaction_id: params.interactionId } : {}),
    generation_config: {
      thinking_level: "low",
    },
    stream: true,
  });

  let fullText = "";
  let modelUsed = GEMINI_MODEL;
  let interactionId: string | undefined = params.interactionId;
  let usage:
    | {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
      }
    | undefined;

  for await (const event of interactionStream) {
    if (event.event_type === "step.delta" && event.delta?.type === "text") {
      const text = event.delta.text ?? "";
      if (text) {
        fullText += text;
        params.onText(text);
      }
    }

    if (event.event_type === "interaction.completed") {
      const interaction = event.interaction;
      modelUsed = interaction?.model || GEMINI_MODEL;
      interactionId = interaction?.id ?? interactionId;

      if (interaction?.usage) {
        usage = {
          inputTokens: interaction.usage.total_input_tokens ?? 0,
          outputTokens: interaction.usage.total_output_tokens ?? 0,
          totalTokens: interaction.usage.total_tokens ?? 0,
        };
      }
    }
  }

  return {
    fullText,
    usage,
    interactionId,
    model: modelUsed,
  };
}

/* -------------------------------------------------------------------------- */
/* Route Handler                                                              */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const sessionId = req.cookies.get("session_id")?.value ?? "";

  const requestOrigin = req.headers.get("origin");
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (
    requestOrigin &&
    allowedOrigins.length > 0 &&
    !allowedOrigins.includes(requestOrigin)
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: {
    message?: string;
    conversationId?: string;
    interactionId?: string;
    intent?: {
      intent: Intent;
      dateTime: DateTimeRequirement;
      lang: Language;
    } | null;
  };

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return new Response("Message is required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const sendNDJSON = (
    controller: ReadableStreamDefaultController,
    data: Record<string, any>
  ) => {
    controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
  };

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponseText = "";
      let activeRouting: RoutingResult = {
        intent: "knowledge",
        dateTime: "not_required",
        lang: "major",
      };
      let provider: "gemini" | "openai" = "openai";

      try {
        const routing = !body.intent ? await routeWithJev(message) : body.intent;
        activeRouting = routing;

        let dateTimeContext = "";
        if (routing.dateTime === "required") {
          const { date, time } = getMaldivesDateTime();
          dateTimeContext = `\nCURRENT MALDIVES DATE AND TIME\nDate: ${date}\nTime: ${time}\n`;
        }

        let knowledgeContext = "";
        if (routing.intent === "knowledge" || routing.lang === "dhivehi") {
          sendNDJSON(controller, {
            type: "tool_start",
            tool: "search_guraidhoo",
          });
          knowledgeContext = await getRAGContext(message);
          
          sendNDJSON(controller, {
            type: "tool_end",
            tool: "search_guraidhoo",
          });
        }

        const baseSystemPrompt =
          routing.intent === "casual" && routing.lang !=="dhivehi" ? CASUAL_SYSTEM_PROMPT : SYSTEM_PROMPT;

        const systemInstruction = `
${baseSystemPrompt}

${dateTimeContext}

${
  routing.intent === "knowledge" ||routing.lang ==="dhivehi"
    ? `
KNOWLEDGE CONTEXT

Use ONLY the information provided below when answering factual
questions about Guraidhoo.

Do not invent businesses, prices, locations, contact information,
opening hours, availability, activities, or other facts.

If the requested information is not available in the knowledge
context, clearly say that the information is not available.

${knowledgeContext}
`
    : ""
}

Keep responses concise and useful.
`;

        provider = routing.lang === "dhivehi" ? "gemini" : "openai";

        if (provider === "gemini") {
          const result = await streamGemini({
            message,
            systemInstruction,
            interactionId: body.interactionId,
            onText(delta) {
              fullResponseText += delta;
              sendNDJSON(controller, { type: "text", delta });
            },
          });

          sendNDJSON(controller, {
            type: "done",
            interactionId: result.interactionId,
            model: result.model,
            provider: "gemini",
          });

          await safeLogConversation({
            sessionId,
            model: result.model,
            userMessage: message,
            assistantResponse: fullResponseText,
            usage: result.usage,
            responseTimeMs: Date.now() - startTime,
            status: "completed",
            provider: "gemini",
            routing,
            interactionId: result.interactionId,
          });
        } else {
          const result = await streamOpenAI({
            message,
            systemInstruction,
            conversationId: body.conversationId,
            onText(delta) {
              fullResponseText += delta;
              sendNDJSON(controller, { type: "text", delta });
            },
          });

          sendNDJSON(controller, {
            type: "done",
            conversationId: result.conversationId,
            model: result.model,
            provider: "openai",
          });

          await safeLogConversation({
            sessionId,
            model: result.model,
            userMessage: message,
            assistantResponse: fullResponseText,
            usage: result.usage,
            responseTimeMs: Date.now() - startTime,
            status: "completed",
            provider: "openai",
            routing,
            conversationId: result.conversationId,
          });
        }

        controller.close();
      } catch (error) {
        console.error("❌ Streaming Error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        sendNDJSON(controller, { type: "error", message: errorMessage });
        controller.error(error);

        await safeLogConversation({
          sessionId,
          model: provider === "gemini" ? GEMINI_MODEL : OPENAI_MODEL,
          userMessage: message,
          assistantResponse: fullResponseText,
          responseTimeMs: Date.now() - startTime,
          status: "error",
          errorMessage,
          provider,
          routing: activeRouting,
        });
      }
    },
  });

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