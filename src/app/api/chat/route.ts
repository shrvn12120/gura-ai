import OpenAI from "openai";
import { NextRequest } from "next/server";
import { vectorSearch } from "@/lib/vectorSearch";
import { aiTools } from "@/lib/aiTools";
import { SYSTEM_PROMPT } from "@/lib/aiPrompt";
import { saveConversationId } from "@/lib/saveConversationId";
import { cookies } from "next/headers";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-5.6-luna";
const MAX_TOOL_LOOPS = 3;

const encoder = new TextEncoder();

type ChatRequest = {
  conversationId?: string;
  message: string;
  sessionId: string;
};

function sendEvent(controller: ReadableStreamDefaultController, data: Record<string, unknown>) {
  controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;

    const origin = req.headers.get("origin");
    const isAllowedOrigin =
      process.env.NODE_ENV === "development"
        ? origin === "http://localhost:3000" ||
          origin === "https://10d6-124-195-202-155.ngrok-free.app"
        : origin === "https://ai.devemm.com";

    if (!isAllowedOrigin) {
      return Response.json(
        { error: "You are not authorized to access this API endpoint." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    let conversationId = cookieStore.get("conversation_id")?.value;
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    const message = body.message?.trim();

    if (!sessionId) {
      return Response.json({ error: "Session ID required" }, { status: 400 });
    }

    if (!conversationId || conversationId === "undefined") {
      const conversation = await openai.conversations.create();
      conversationId = conversation.id;
      saveConversationId(conversation.id);
    } else {
      console.log("Continuing OpenAI conversation:", conversationId);
    }

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let responseStream = await openai.responses.create({
            model: MODEL,
            conversation: conversationId,
            instructions: SYSTEM_PROMPT,
            input: [{ role: "user", content: message }],
            tools: aiTools,
            stream: true,
          });

          let toolCalls: OpenAI.Responses.ResponseFunctionToolCall[] = [];

          for await (const event of responseStream) {
            if (event.type === "response.output_text.delta") {
              if (event.delta) {
                console.log({event})
                sendEvent(controller, {
                  type: "text",
                  delta: event.delta,
                });
              }
            }

            if (event.type === "response.output_item.done") {
              if (event.item.type === "function_call") {
                toolCalls.push(event.item);
              }
            }

            if (event.type === "response.completed") break;

            if (event.type === "error") {
              throw new Error(event.message ?? "OpenAI streaming error");
            }
          }

          /* TOOL LOOP */
          for (
            let loop = 0;
            toolCalls.length > 0 && loop < MAX_TOOL_LOOPS;
            loop++
          ) {
            const toolOutputs: OpenAI.Responses.ResponseInputItem[] = [];

            for (const toolCall of toolCalls) {
              if (toolCall.name !== "search_guraidhoo") continue;

              let args: { query: string; limit: number };
              try {
                args = JSON.parse(toolCall.arguments);
              } catch {
                throw new Error("Invalid tool arguments");
              }

              const searchQuery = args.query?.trim();
              const searchLimit =
                typeof args.limit === "number" && args.limit > 0
                  ? Math.min(Math.floor(args.limit), 15)
                  : 4;

              if (!searchQuery) throw new Error("Empty search query");

              sendEvent(controller, {
                type: "tool_start",
                tool: "search_guraidhoo",
              });

              const results = await vectorSearch(searchQuery, searchLimit);

              // Raw search results passed cleanly to the model


              const cleanResults = results.map((result) => {
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
    cleanObject.formatted_images = result.images.map((img) => `![${img.alt}](${img.url})`)
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

            responseStream = await openai.responses.create({
              model: MODEL,
              conversation: conversationId,
              input: toolOutputs,
              tools: aiTools,
              stream: true,
            });

            toolCalls = [];
            for await (const event of responseStream) {
                
              if (event.type === "response.output_text.delta") {
  
               
                if (event.delta) {
                  sendEvent(controller, {
                    type: "text",
                    delta: event.delta,
                  });
                }
              }

              if (event.type === "response.output_item.done") {
                if (event.item.type === "function_call") {
                  toolCalls.push(event.item);
                }
              }

              if (event.type === "response.completed") break;

              if (event.type === "error") {
                throw new Error(event.message ?? "OpenAI streaming error");
              }
            }
          }

          if (toolCalls.length > 0) {
            sendEvent(controller, {
              type: "error",
              error: "The assistant could not complete the request.",
            });
          }

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
        "Set-Cookie": `conversation_id=${conversationId}; Path=/; HttpOnly; SameSite=Lax`,
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Invalid chat request:", error);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}