import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { vectorSearch } from "@/lib/vectorSearch";
import { SYSTEM_PROMPT } from "@/lib/aiPrompt";
import { searchGuraidhooTool } from "@/lib/geminiTools";
import { logGeminiRequest } from "@/lib/logGeminiRequest";

/* =========================================================
   CONFIG
========================================================= */

export const MODEL = "gemini-3.8-flash";

const MAX_TOOL_LOOPS = 3;

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

type FunctionCall = {
  id: string;
  name: string;
  arguments: string;
  index?: number;
};

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
   CLEAN SEARCH RESULTS
========================================================= */

function cleanSearchResults(results: any[]) {
  return results.map((result) => {
  const contact = (result.contactInfo as Record<string, any>) || {};

  const cleanObject: Record<string, any> = {
    id: result.id,
    title: result.title,
    description: result.description,
  };

  // Only include optional scalar keys if they contain values
  if (result.category) cleanObject.category = result.category;
  if (result.subCategory) cleanObject.subCategory = result.subCategory;
  if (contact.address) cleanObject.address = contact.address;

  // Images: Already pre-formatted as Markdown strings in vectorSearch()
  if (Array.isArray(result.images) && result.images.length > 0) {
    cleanObject.formatted_images = result.images.map((img: { alt: string; url: string }) => `![${img.alt}](${img.url})`)
  }

  // Formatted Phone
  if (contact.phone) {
    cleanObject.formatted_phone = `[${contact.phone}](tel:${contact.phone.replace(/\s+/g, "")})`;
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

  return cleanObject;
});
}




/* =========================================================
   TOOL EXECUTION
========================================================= */

async function executeTool(toolCall: FunctionCall) {
  console.log(`\n🛠️ [DEBUG] Executing Tool: "${toolCall.name}" (ID: ${toolCall.id})`);
  console.log(`🛠️ [DEBUG] Raw Arguments:`, toolCall.arguments);

  if (toolCall.name === "search_guraidhoo") {
    let args: { query?: string; limit?: number };

    try {
      args = JSON.parse(toolCall.arguments || "{}");
    } catch (error) {
      console.error("❌ [DEBUG] Invalid tool arguments JSON:", toolCall.arguments);
      return { error: "Invalid search arguments." };
    }

    const query = String(args.query || "").trim();
    const requestedLimit = Number(args.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), 10)
      : 5;

    if (!query) {
      console.warn("⚠️ [DEBUG] Empty query passed to search_guraidhoo");
      return { error: "Search query is required." };
    }

    try {
      console.log(`🔍 [DEBUG] Querying VectorDB: "${query}" (limit: ${limit})`);
      const rawResults = await vectorSearch(query, limit);
      const cleaned = cleanSearchResults(rawResults);

      console.log(`✅ [DEBUG] VectorDB returned ${cleaned.length} item(s).`);
      if (cleaned.length > 0) {
        console.log(`📄 [DEBUG] Sample Result Title:`, cleaned[0].title);
      } else {
        console.warn(`⚠️ [DEBUG] VectorDB returned 0 results for query: "${query}"`);
      }

      return {
        query,
        results: cleaned,
      };
    } catch (error) {
      console.error("❌ [DEBUG] Vector search execution failed:", error);
      return {
        query,
        results: [],
        error: "Unable to search the Guraidhoo database.",
      };
    }
  }

  console.error(`❌ [DEBUG] Unknown tool requested: ${toolCall.name}`);
  return { error: `Unknown tool: ${toolCall.name}` };
}

/* =========================================================
   USAGE EXTRACTION
========================================================= */

function extractUsage(interaction: any): UsageStats {
  const usage = interaction?.usage;

  if (!usage) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }

  const inputTokens = Number(
    usage.total_input_tokens ?? usage.input_tokens ?? usage.prompt_tokens ?? 0
  );

  const outputTokens = Number(
    usage.total_output_tokens ?? usage.output_tokens ?? usage.completion_tokens ?? 0
  );

  const reportedTotal = Number(usage.total_tokens ?? 0);
  const totalTokens = reportedTotal > 0 ? reportedTotal : inputTokens + outputTokens;

  return { inputTokens, outputTokens, totalTokens };
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
  const sessionId = req.cookies.get("session_id")?.value;

  if (!sessionId) {
    return jsonResponse({ error: "Missing session. Please refresh the page." }, 401);
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

  if (!process.env.GEMINI_API_KEY) {
    return jsonResponse({ error: "GEMINI_API_KEY is not configured." }, 500);
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
        } catch {
          // Already closed.
        }
      };

      const requestStart = Date.now();
      let previousInteractionId = interactionId;
      let finalAssistantResponse = "";
      let totalToolCalls = 0;

      const totalUsage: UsageStats = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };

      let currentInput: any = message;

      try {
        console.log(`\n==================================================`);
        console.log(`🚀 [DEBUG] New User Chat Request: "${message}"`);
        console.log(`==================================================`);

        /* =================================================
           TOOL LOOP
        ================================================= */

        for (let toolLoop = 0; toolLoop <= MAX_TOOL_LOOPS; toolLoop++) {
          console.log(`\n🔄 [DEBUG] Starting Loop Iteration ${toolLoop}/${MAX_TOOL_LOOPS}`);

          const pendingToolCalls: FunctionCall[] = [];
          const toolCallByIndex = new Map<number, FunctionCall>();
          let currentInteractionId: string | undefined;

          try {
            console.log(`📡 [DEBUG] Calling ai.interactions.create...`);
            console.log(`📡 [DEBUG] previousInteractionId:`, previousInteractionId ?? "None");
            console.log(`📡 [DEBUG] Input payload:`, JSON.stringify(currentInput).slice(0, 150) + "...");

            const interactionStream = await ai.interactions.create({
              model: MODEL,
              system_instruction: SYSTEM_PROMPT,
              tools: [searchGuraidhooTool],
              ...(previousInteractionId
                ? { previous_interaction_id: previousInteractionId }
                : {}),
              input: currentInput,
              stream: true,
            });

            for await (const event of interactionStream) {
              const eventAny = event as any;

              if (eventAny.event_type === "interaction.created") {
                currentInteractionId = eventAny.interaction?.id;
                if (currentInteractionId) {
                  previousInteractionId = currentInteractionId;
                }
              } else if (
                eventAny.event_type === "step.start" &&
                eventAny.step?.type === "function_call"
              ) {
                const step = eventAny.step;
                const index = Number(
                  eventAny.index ?? step.index ?? pendingToolCalls.length
                );

                const call: FunctionCall = {
                  id: step.id || "",
                  name: step.name || "",
                  arguments: "",
                  index,
                };

                pendingToolCalls.push(call);
                toolCallByIndex.set(index, call);

                console.log(`⚙️ [DEBUG] Detected Tool Call Start: ${call.name} (Index: ${index})`);

                send({
                  type: "tool_start",
                  tool: call.name,
                });
              } else if (
                eventAny.event_type === "step.delta" &&
                eventAny.delta?.type === "arguments_delta"
              ) {
                const delta = eventAny.delta.arguments || "";
                const rawIndex = eventAny.index ?? eventAny.step?.index;
                const index = rawIndex !== undefined ? Number(rawIndex) : NaN;

                let call: FunctionCall | undefined;
                if (Number.isFinite(index)) {
                  call = toolCallByIndex.get(index);
                }

                if (!call) {
                  call = pendingToolCalls[pendingToolCalls.length - 1];
                }

                if (call && delta) {
                  call.arguments += delta;
                }
              } else if (
                eventAny.event_type === "step.delta" &&
                eventAny.delta?.type === "text"
              ) {
                const text = eventAny.delta.text || "";
                if (text) {
                  send({
                    type: "text",
                    delta: text,
                  });
                  finalAssistantResponse += text;
                }
              } else if (eventAny.event_type === "interaction.completed") {
                const completed = eventAny.interaction;
                if (completed?.id) {
                  previousInteractionId = completed.id;
                }

                const usage = extractUsage(completed);
                totalUsage.inputTokens += usage.inputTokens;
                totalUsage.outputTokens += usage.outputTokens;
                totalUsage.totalTokens += usage.totalTokens;
              } else if (eventAny.event_type === "error") {
                throw new Error(
                  eventAny.error?.message || "Gemini interaction failed."
                );
              }
            }

            // No pending tool calls means Gemini provided the final answer
            if (pendingToolCalls.length === 0) {
              console.log(`✅ [DEBUG] No tool calls triggered. Gemini generated text response.`);
              break;
            }

            totalToolCalls += pendingToolCalls.length;
            console.log(`📊 [DEBUG] Total pending tool calls in this loop: ${pendingToolCalls.length}`);

            /* =============================================
               MAX TOOL LOOP BREAK
            ============================================= */

            if (toolLoop >= MAX_TOOL_LOOPS - 1) {
              console.warn(`⚠️ [DEBUG] Hit MAX_TOOL_LOOPS limit! Halting tool execution.`);

              const fallbackMsg = "I don't have that information in my knowledge base.";
              
              send({
                type: "text",
                delta: fallbackMsg,
              });

              finalAssistantResponse = fallbackMsg;
              break;
            }

            /* =============================================
               EXECUTE TOOLS & PREPARE NEXT INPUT
            ============================================= */

            const functionResults: any[] = [];

            for (const toolCall of pendingToolCalls) {
              const toolResult = await executeTool(toolCall);

              /* =========================================================
                 CRITICAL FIX HERE:
                 Pass `toolResult` directly as the result object.
                 Do NOT wrap inside a `[{ type: "text", text: "..." }]` array!
              ========================================================= */
              functionResults.push({
                type: "function_result",
                name: toolCall.name,
                call_id: toolCall.id,
                result: toolResult, // Direct object!
              });

              send({
                type: "tool_end",
                tool: toolCall.name,
              });
            }

            console.log(`📤 [DEBUG] Sending function_result back to Gemini:`, JSON.stringify(functionResults, null, 2));

            if (!previousInteractionId && currentInteractionId) {
              previousInteractionId = currentInteractionId;
            }

            if (!previousInteractionId) {
              throw new Error("Missing Gemini interaction ID after tool call.");
            }

            // Set currentInput for the next loop turn
            currentInput = functionResults;
          } catch (geminiError) {
            throw geminiError;
          }
        }

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
        });

        close();
      } catch (error) {
        console.error("❌ [DEBUG] Chat request failed:", error);

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