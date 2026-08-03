// import { NextRequest } from "next/server";
// import OpenAI from "openai";
// import { classifyIntent, retrieveContext } from "@/app/action";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     // Expect an array of conversational messages from the client interface
//     const messages = body.messages as OpenAI.Chat.ChatCompletionMessageParam[] | undefined;

//     if (!messages || !Array.isArray(messages) || messages.length === 0) {
//       return Response.json({ error: "Messages array is required" }, { status: 400 });
//     }

//     // Capture the latest prompt sent by the user for Vector Querying
//     const lastUserMessage = messages[messages.length - 1];
//     if (lastUserMessage.role !== "user" || !lastUserMessage.content) {
//       return Response.json({ error: "Last message must be a valid user prompt" }, { status: 400 });
//     }

//     const queryText = String(lastUserMessage.content).trim();
//     const conversationHistory = messages.slice(-4);

//     // const {list, aboutIsland, more, single}
//    const intent = await classifyIntent(messages.at(-1)?.content as string, conversationHistory)

//    const x = await retrieveContext(intent, queryText)

//    let data;

//    if(x && x.length < 0){
// data = await retrieveContext({
//   type: "semantic",
//   name: null,
//   category: null,
//   subCategory: null
// }, queryText)

// console.log("running")
//    }
//    else{
//     data = x
//     console.log(x?.length)
//    }

//     const systemInstruction = {
//       role: "system" as const,
//       content: `You are an AI Concierge. Answer ONLY using the context provided below.
// If the information is missing from the context, state clearly that you have no information about it. Always be clear and string. answer in short informative way.
// - Your goal is to guide traverllers and visitiors to guraidhoo island, so they can get any help from you while they stay on guraidhoo island.
// - USD convertion rate is 15.42 mvr (Bank rate)
// - At initial conversation if user greets, greet them with proper introduction.

// Rules:
// - Never invent businesses, prices, or operational coordinates.
// - Maintain a helpful, conversational local tone.
// - When neede give user google map link for location if coordinates are available (lable must me meaning full, not coordinates).
// - When giving phone numbers, make sure it's clickable accordingly.
// - If a place has one or more images and the user asks what it looks like, include the image(s) using Markdown:
//   ![Meaningful description](IMAGE_URL "Tooltip text")

// CRITICAL RULE FOR IMAGE_URL

// - Output IMAGE_URL exactly as stored in the context.
// - Do NOT modify, reconstruct, or normalize the URL.
// - Do NOT change the domain, filename, path, capitalization, query parameters, or extension.
// - Do NOT replace the ImageKit URL with another URL.
// - If no suitable image exists in the current context, tell there is no image to give.

// IMAGE SELECTION

// - If the listing contains multiple images, choose the SINGLE image that best matches the user's request.
// - Match the user's request against each image's "alt" text.
// - If an image's alt text  matches the requested subject, use that image.
// - If multiple images match, choose the most specific match.
// - If no alt text matches, choose the most representative image of the listing.
// - Never choose an unrelated image simply because one exists.
// - If multiple images are available, show up to 3.
// - Never invent image URLs.

// URL OUTPUT

// - Output IMAGE_URL exactly as stored in the context.
// - If the stored value is a relative path, return the relative path exactly as provided.
// - If the stored value is a full ImageKit URL (https://ik.imagekit.io/...), return the full URL exactly as provided.
// - Never prepend, append, or modify any part of the URL.
// Context:
// ${data}`
//     };

//     // Combine system prompt with recent conversation history
//     const finalChatMessages = [systemInstruction, ...conversationHistory];
//     // 5. Open stream configuration
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       //  gpt-4o-mini
//       stream: true,
//       temperature: 0.2, // Lowered temperature blocks creative fabrications
//       messages: finalChatMessages,
//       max_completion_tokens: 5000
//     });

//     const encoder = new TextEncoder();
//     const readable = new ReadableStream({
//       async start(controller) {
//         try {
//           for await (const chunk of completion) {
//             const text = chunk.choices?.[0]?.delta?.content;
//             if (text) {
//               controller.enqueue(encoder.encode(text));
//             }
//           }
//           controller.close();
//         } catch (err) {
//           controller.error(err);
//         }
//       },
//     });

//     return new Response(readable, {
//       headers: {
//         "Content-Type": "text/plain; charset=utf-8",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//       },
//     });
//   } catch (error: any) {
//     console.error(error);
//     return Response.json(
//       { error: error.message ?? "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

import { extractSearch } from "@/lib/extractSearch";
import { searchRouter } from "@/lib/searchRouter";
import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const messages = body.messages as OpenAI.Chat.ChatCompletionMessageParam[];

    if (!messages || messages.length === 0) {
      return Response.json(
        {
          error: "Messages required",
        },
        {
          status: 400,
        },
      );
    }

    /*
      Latest user message
    */

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.role !== "user") {
      return Response.json(
        {
          error: "Invalid message",
        },
        {
          status: 400,
        },
      );
    }

    const queryText = String(lastMessage.content);

    /*
      Keep conversation context

      Used for:
      - they
      - it
      - that place
      - nearby
    */

    const conversationHistory = messages.slice(-6);

    /*
      STEP 1

      AI extracts:

      {
        language,
        searchType,
        keywords,
        place
      }

    */

    const searchIntent = await extractSearch(queryText, conversationHistory);

    /*
      STEP 2

      Decide Fuse or Vector
    */

    const searchResult = await searchRouter(searchIntent, queryText);

    const context = JSON.stringify(searchResult.results);

    /*
      Final AI instruction
    */

    const systemInstruction = {
      role: "system" as const,

      content: `
You are Explore Guraidhoo AI GUIDE.

Answer ONLY using the provided context.
If information is missing, clearly say you don't have that information.
Keep answers short, clear.

Purpose:
Help visitors and travelers on Guraidhoo island.

Rules:
- Never invent businesses, prices, availability, coordinates, or facts.
- Use a friendly local concierge tone.
- USD rate: 15.42 MVR.
- For greetings, introduce yourself as Explore Guraidhoo AI Concierge.
- Phone numbers must be clickable Markdown links.
- Only provide map links when coordinates exist in the context, with a meaningful label.
-Dont give raw coordinates to user.

Images:
- Only use images provided in the context.
- Never create or modify image URLs.
- Use the exact stored URL.
- If the user asks what a place looks like, include the most relevant image.
- Match image alt text with the user's request.
- Show up to 3 images only.
- If no suitable image exists, say no image is available.
Context:
${context}
`,
    };

    const finalMessages = [systemInstruction, ...conversationHistory];

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4-nano-2026-03-17",

      stream: true,

      temperature: 0.2,

      messages: finalMessages,

      max_completion_tokens: 5000,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;

            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",

        "Cache-Control": "no-cache",

        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error: error.message ?? "Server error",
      },
      {
        status: 500,
      },
    );
  }
}
