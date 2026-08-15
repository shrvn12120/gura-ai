import OpenAI from "openai";
import { NextRequest } from "next/server";
import { vectorSearch } from "@/lib/vectorSearch";
import { aiTools } from "@/lib/aiTools";
import { SYSTEM_PROMPT } from "@/lib/aiPrompt";
import { saveConversationId } from "@/lib/saveConversationId";


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-5.4-nano-2026-03-17";
// gpt-5.4-nano

const MAX_TOOL_LOOPS = 3;

const encoder = new TextEncoder();

type ChatRequest = {
  conversationId: string;
  message: string;
  sessionId: string;
};

function sendEvent(controller: ReadableStreamDefaultController, data: unknown) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;

    const origin = req.headers.get("origin");
    const isAllowedOrigin =
      process.env.NODE_ENV === "development"
        ? origin === "http://localhost:3000"
        : origin === "https://ai.devemm.com";

    if (!isAllowedOrigin) {
      return Response.json(
        {
          error: "You are not authorized to access this API endpoint.",
        },
        {
          status: 403,
        },
      );
    }


    let conversationId =
      typeof body.conversationId === "string" ? body.conversationId : null;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";

    const message = body.message?.trim();

    /*
     * ---------------------------------------------
     * Validate request
     * ---------------------------------------------
     */

    if (!sessionId) {
      return Response.json(
        {
          error: "Session ID required",
        },
        {
          status: 400,
        },
      );
    }
    let isNewConversation = false;
    if (!conversationId) {
      const conversation = await openai.conversations.create();

      conversationId = conversation.id;
      saveConversationId(conversationId);

      isNewConversation = true;

      console.log("Created new OpenAI conversation:", conversationId);
    } else {
      console.log("Continuing OpenAI conversation:", conversationId);
    }

    if (!message) {
      return Response.json(
        {
          error: "message is required",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ---------------------------------------------
     * Streaming response
     * ---------------------------------------------
     */

    const stream = new ReadableStream({
      async start(controller) {
        try {
          /*
           * -----------------------------------------
           * FIRST AI REQUEST
           * -----------------------------------------
           *
           * IMPORTANT:
           *
           * NO VECTOR SEARCH HERE.
           *
           * The model first checks the existing
           * conversation.
           */

          let responseStream = await openai.responses.create({
            model: MODEL,

            conversation: conversationId,

            instructions: SYSTEM_PROMPT,

            input: [
              {
                role: "user",
                content: message,
              },
            ],

            tools: aiTools,

            stream: true,
          });

          let toolCalls: OpenAI.Responses.ResponseFunctionToolCall[] = [];

          /*
           * -----------------------------------------
           * PROCESS STREAM
           * -----------------------------------------
           */

          for await (const event of responseStream) {
            /*
             * Normal assistant text
             */

            if (event.type === "response.output_text.delta") {
              sendEvent(controller, {
                type: "text",
                delta: event.delta,
              });
            }

            /*
             * Function call completed
             */

            if (event.type === "response.output_item.done") {
              const item = event.item;

              if (item.type === "function_call") {
                toolCalls.push(item);
              }
            }

            /*
             * Response completed
             */

            if (event.type === "response.completed") {
              break;
            }

            /*
             * OpenAI stream error
             */

            if (event.type === "error") {
              throw new Error(event.message ?? "OpenAI streaming error");
            }
          }

          /*
           * -----------------------------------------
           * TOOL LOOP
           * -----------------------------------------
           */

          for (
            let loop = 0;
            toolCalls.length > 0 && loop < MAX_TOOL_LOOPS;
            loop++
          ) {
            const toolOutputs: OpenAI.Responses.ResponseInputItem[] = [];

            /*
             * Execute every requested tool.
             */

            for (const toolCall of toolCalls) {
              if (toolCall.name !== "search_guraidhoo") {
                continue;
              }

              let args: {
                query: string;
                limit: number;
              };

            try {
  args = JSON.parse(toolCall.arguments);
} catch {
  throw new Error("Invalid tool arguments");
}

              const searchQuery = args.query?.trim();
const searchLimit = typeof args.limit === "number" && args.limit > 0 
  ? Math.min(Math.floor(args.limit), 15) 
  : 4;

              if (!searchQuery) {
                throw new Error("Empty search query");
              }

              /*
               * Send optional status to frontend.
               */

              sendEvent(controller, {
                type: "tool_start",
                tool: "search_guraidhoo",
              });

              console.log(`[AI TOOL] search_guraidhoo: ${searchQuery}`);

              /*
               * -------------------------------------
               * YOUR PGVECTOR SEARCH
               * -------------------------------------
               */

              const results = await vectorSearch(searchQuery, searchLimit);

              /*
               * Don't send unnecessary DB data
               * to the model.
               */

              const cleanResults = results.map((result) => ({
                id: result.id,
                name: result.title,
                content: result.description,
                category: result.category,
                subCategory: result.subCategory,
                metadata: result.metadata,
                contact_info: result.contactInfo,
                images: result.images,
              }));

              toolOutputs.push({
                type: "function_call_output",
                call_id: toolCall.call_id,
                output: JSON.stringify({
                  query: searchQuery,
                  results: cleanResults,
                }),
              });

              sendEvent(controller, {
                type: "tool_end",
                tool: "search_guraidhoo",
              });
            }

            /*
             * -----------------------------------------
             * SEND TOOL RESULT BACK TO OPENAI
             * -----------------------------------------
             */

            responseStream = await openai.responses.create({
              model: MODEL,

              conversation: conversationId,

              input: toolOutputs,

              tools: aiTools,

              stream: true,
            });

            /*
             * Reset tool calls.
             */

            toolCalls = [];

            /*
             * -----------------------------------------
             * PROCESS SECOND AI RESPONSE
             * -----------------------------------------
             */

            for await (const event of responseStream) {
              /*
               * Stream final answer tokens.
               */

              if (event.type === "response.output_text.delta") {
                sendEvent(controller, {
                  type: "text",
                  delta: event.delta,
                });
              }

              /*
               * AI may request another tool.
               */

              if (event.type === "response.output_item.done") {
                const item = event.item;

                if (item.type === "function_call") {
                  toolCalls.push(item);
                }
              }

              if (event.type === "response.completed") {
                break;
              }

              if (event.type === "error") {
                throw new Error(event.message ?? "OpenAI streaming error");
              }
            }
          }

          /*
           * -----------------------------------------
           * LOOP LIMIT
           * -----------------------------------------
           */

          if (toolCalls.length > 0) {
            console.warn("Maximum tool loop reached");

            sendEvent(controller, {
              type: "error",
              error: "The assistant could not complete the request.",
            });
          }

          /*
           * -----------------------------------------
           * FINISH
           * -----------------------------------------
           */

          sendEvent(controller, {
            type: "done",
            conversationId,
          });

          controller.close();
        } catch (error) {
          console.error("Chat stream error:", error);

          sendEvent(controller, {
            type: "error",
            error: "Failed to generate response.",
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,

      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",

        "Cache-Control": "no-cache, no-transform",

        "X-Accel-Buffering": "no",

        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Invalid chat request:", error);

    return Response.json(
      {
        error: "Invalid request",
      },
      {
        status: 400,
      },
    );
  }
}
