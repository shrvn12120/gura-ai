import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

import { vectorSearch } from "@/lib/vectorSearch";
import { SYSTEM_PROMPT } from "@/lib/aiPrompt";
import { logGeminiRequest } from "@/lib/logGeminiRequest";

/* =========================================================
   CONFIG & CONSTANTS
========================================================= */

export const MODEL = "gemini-3.8-flash";
const JEV_MODEL = "jev-latest";
const RAG_LIMIT = 10;

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
   CLIENT INITIALIZATION
========================================================= */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const typeSafeClient = new TypeSafeClient({
  apiKey: process.env.JEV_API_KEY,
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
};

type JevResponse = {
  answers?: {
    intent?: JevChoice;
    date_time?: JevChoice;
  };
};

type RoutingResult = {
  intent: "casual" | "knowledge";
  dateTime: "required" | "not_required";
};

/* =========================================================
   HELPERS & UTILS
========================================================= */

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

function extractUsage(interaction: any): UsageStats {
  const usage = interaction?.usage;
  if (!usage) return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

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

  return {
    inputTokens,
    outputTokens,
    totalTokens: reportedTotal > 0 ? reportedTotal : inputTokens + outputTokens,
  };
}

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
   ROUTING & RAG
========================================================= */

async function routeWithJev(message: string): Promise<RoutingResult> {
  const { JEV_API_URL, JEV_API_KEY } = process.env;
  if (!JEV_API_URL || !JEV_API_KEY) {
    throw new Error("JEV API configurations missing.");
  }

  const response = await fetch(JEV_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JEV_API_KEY}`,
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

  return {
    intent:
      result.answers?.intent?.choice === "casual" ? "casual" : "knowledge",
    dateTime:
      result.answers?.date_time?.choice === "required"
        ? "required"
        : "not_required",
  };
}

async function jevRetrieve(query: string, data: any[]) {
  if (!data?.length) return [];

  const questions = Object.fromEntries(
    data.map((candidate: any) => [
      `${String(candidate.id)}`,
      noul(
        `Does this listing meaningfully match the user's request?\n\nUser message:\n"${query}"\n\nListing: ${JSON.stringify(
          candidate,
        )}\n\nReturn a high probability only when this listing contains information that would be useful for answering the user's request.`,
      ),
    ]),
  );

  const result = await typeSafeClient.systemOne({
    model: JEV_MODEL,
    state: query,
    questions,
  });

  return data.filter((candidate: any) => {
    const answer = result?.answers?.[`${String(candidate.id)}`];
    return Number(answer?.noul ?? 0) >= 0.25;
  });
}

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
      typeof lat === "number" &&
      typeof lng === "number" &&
      !(lat === 0 && lng === 0)
    ) {
      cleanObject.formatted_map_link = `[Show On Map](https://www.google.com/maps/search/?api=1&query=${lat},${lng})`;
    }

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
    )
      return null;
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

async function getRAGContext(query: string) {
  try {
    const rawResults = await vectorSearch(query, RAG_LIMIT);
    const matchedResults = await jevRetrieve(query, rawResults);
    const cleanedResults = cleanSearchResults(matchedResults);

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
   POST HANDLER
========================================================= */

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("session_id")?.value;
  const requestOrigin = req.headers.get("origin");
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return jsonResponse({ error: "Not allowed." }, 403);
  }

  if (!sessionId) {
    return jsonResponse(
      { error: "Missing session. Please refresh the page." },
      401,
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return jsonResponse({ error: "GEMINI_API_KEY is not configured." }, 500);
  }

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

      const requestStart = Date.now();
      let previousInteractionId = interactionId;
      let finalAssistantResponse = "";
      const totalUsage: UsageStats = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };

      try {
        const routing = await routeWithJev(message);

        let geminiInput = message;
        let dateTimeContext = "";

        if (routing.dateTime === "required") {
          const current = getMaldivesDateTime();
          dateTimeContext = `Current date: ${current.date}\nCurrent time: ${current.time}\nTimezone: ${current.timezone}\nUTC offset: ${current.utcOffset}`;
        }

        if (routing.intent === "knowledge") {
          const rag = await getRAGContext(message);
          geminiInput = `User question:\n${message}\n\n${
            dateTimeContext ? `${dateTimeContext}\n\n` : ""
          }Knowledge Context:\n${rag.context}`;
        }

        const systemInstruction =
          routing.intent === "casual" ? CASUAL_SYSTEM_PROMPT : SYSTEM_PROMPT;

        const interactionStream = await ai.interactions.create({
          model: MODEL,
          system_instruction: systemInstruction,
          ...(previousInteractionId
            ? { previous_interaction_id: previousInteractionId }
            : {}),
          input: geminiInput,
          generation_config: { thinking_level: "low" },
          stream: true,
        });

        for await (const event of interactionStream) {
          const eventAny = event as any;

          if (eventAny.event_type === "interaction.created") {
            if (eventAny.interaction?.id) {
              previousInteractionId = eventAny.interaction.id;
            }
          } else if (
            eventAny.event_type === "step.delta" &&
            eventAny.delta?.type === "text"
          ) {
            const text = eventAny.delta.text || "";
            if (text) {
              finalAssistantResponse += text;
              send({ type: "text", delta: text });
            }
          } else if (eventAny.event_type === "interaction.completed") {
            if (eventAny.interaction?.id) {
              previousInteractionId = eventAny.interaction.id;
            }
            const usage = extractUsage(eventAny.interaction);
            totalUsage.inputTokens += usage.inputTokens;
            totalUsage.outputTokens += usage.outputTokens;
            totalUsage.totalTokens += usage.totalTokens;
          } else if (eventAny.event_type === "error") {
            throw new Error(
              eventAny.error?.message || "Gemini interaction failed.",
            );
          }
        }

        const responseTimeMs = Date.now() - requestStart;

        safeLogConversation({
          sessionId,
          userMessage: message,
          assistantResponse: finalAssistantResponse,
          usage: totalUsage,
          toolCalls: 0,
          responseTimeMs,
          status: "completed",
        });

        send({
          type: "done",
          sessionId,
          interactionId: previousInteractionId,
        });

        close();
      } catch (error) {
        console.error("❌ Chat request failed:", error);
        const responseTimeMs = Date.now() - requestStart;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        safeLogConversation({
          sessionId,
          userMessage: message,
          assistantResponse: finalAssistantResponse,
          usage: totalUsage,
          toolCalls: 0,
          responseTimeMs,
          status: "error",
          errorMessage,
        });

        send({ type: "error", message: errorMessage });
        close();
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
