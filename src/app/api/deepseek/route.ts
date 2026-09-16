//  apiKey: "sk-f1f939036e8648e092f5f6154111cb23",

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { vectorSearch } from "@/lib/vectorSearch"; // Adjust import path to your project
import { SYSTEM_PROMPT } from "@/lib/aiPrompt";

// Initialize DeepSeek client using standard OpenAI SDK
const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: "sk-f1f939036e8648e092f5f6154111cb23"
});


// 1. Define Tool Schema (OpenAI / DeepSeek Format)
const searchGuraidhooTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "search_guraidhoo",
    description: "Searches local guesthouse and island information database.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        limit: {
          type: "number",
          description: "Number of search results to return",
        },
      },
      required: ["query"],
    },
  },
};

// 2. Helper to sanitize search results
function cleanSearchResults(results: any[]) {
  return results.map((result) => {
    const contact = (result.contactInfo as Record<string, any>) || {};
    const meta = result.metadata?.toJSON
      ? result.metadata.toJSON()
      : result.metadata || {};

    return {
      title: result.title,
      description: result.description
        ? String(result.description).replace(/\s+/g, " ").trim()
        : "",
      category: result.category || undefined,
      address: contact.address || undefined,
      phone: contact.phone || undefined,
      email: contact.email || undefined,
      metadata: {
        price: meta.price || meta.priceRange,
        rating: meta.rating,
        amenities: meta.amenities || meta.features,
        openingHours: meta.openingHours || meta.hours,
      },
    };
  });
}

// 3. Main API Route Handler
export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Turn 1: Call DeepSeek to evaluate query & check for tool call
    const initialCompletion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      tools: [searchGuraidhooTool],
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: 600,
    });

    const responseMessage = initialCompletion.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // If DeepSeek triggers tool execution
    if (toolCalls && toolCalls.length > 0) {
      const updatedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
        responseMessage,
      ];

for (const toolCall of toolCalls) {
    // 1. Narrow type check so TypeScript knows `toolCall.function` exists
    if (toolCall.type === "function" && toolCall.function.name === "search_guraidhoo") {
      const args = JSON.parse(toolCall.function.arguments);
      const query = args.query;
      const limit = args.limit || 5;

      // Perform Vector Search
      const rawResults = await vectorSearch(query, limit);
      const cleanedResults = cleanSearchResults(rawResults);

      // Append tool execution result into context
      updatedMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(cleanedResults),
      });
    }
  }

      // Turn 2: Stream final response based on tool results
      const finalStream = await deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: updatedMessages,
        stream: true,
        temperature: 0.2,
        max_tokens: 600,
      });

      // Construct ReadableStream for streaming response back to browser
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of finalStream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Direct stream if no tool calls were requested
    const directStream = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
      temperature: 0.2,
      max_tokens: 600,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of directStream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error in /api/chat (DeepSeek):", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}