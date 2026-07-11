// import { NextRequest } from "next/server";
// import OpenAI from "openai";
// import connectDB from "@/lib/mongodb";
// import Listing from "@/models/Listing";

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



    

//     await connectDB();

//     // 1. Generate text embeddings targeting only the newest user question
//     const embeddingResponse = await openai.embeddings.create({
//       model: "text-embedding-3-small",
//       input: queryText,
//     });
//     const vector = embeddingResponse.data[0].embedding;

//     // 2. Optimized vector aggregation with tight projection limit 
//     const docs = await Listing.aggregate([
//       {
//         $vectorSearch: {
//           index: "vector_index",
//           path: "embedding",
//           queryVector: vector,
//           numCandidates: 100,
//           limit: 3, // Tightened limit preserves model focus and reduces token cost
//         },
//       },
//       {
//         $project: {
//           title: 1,
//           category: 1,
//           subCategory: 1,
//           description: 1,
//           contact_info: 1,
//           metadata: 1,
//         }
//       }
//     ]);

//     // 3. Compact contextual data layout formatting
//     const contextString = docs
//       .map((doc, idx) => {
//         return `[DOC ${idx + 1}] ${doc.title} (${doc.category} in ${doc.island || "Guraidhoo"})
// Category: ${doc.category}
// SubCategory: ${doc.subCategory}
// Details: ${doc.description}
// Contact_info: ${JSON.stringify(doc.contact_info)}
// Spec: ${JSON.stringify(doc.metadata)}`;
//       })
//       .join("\n\n");
//     // 4. Thread Setup: Keep a sliding history window (e.g., last 6 messages) to prevent memory leak
//     const conversationHistory = messages.slice(-6);

//     const systemInstruction = {
//       role: "system" as const,
//       content: `You are an AI Concierge. Answer ONLY using the context provided below. 
// If the information is missing from the context, state clearly that you have no information about it.

// Rules:
// - Never invent businesses, prices, or operational coordinates.
// - Maintain a helpful, conversational local tone.
// - Give user google map link for location with coordinates available as direction link.
// -when giving phone numbers, make sure it's clickable accordingly.

// Context:
// ${contextString}`
//     };

//     // Combine system prompt with recent conversation history
//     const finalChatMessages = [systemInstruction, ...conversationHistory];

//     // 5. Open stream configuration
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       stream: true,
//       temperature: 0.2, // Lowered temperature blocks creative fabrications
//       messages: finalChatMessages,
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

import { NextRequest } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/mongodb";
import Listing from "@/models/Listing";
import { classifyIntent } from "@/app/action";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Expect an array of conversational messages from the client interface
    const messages = body.messages as OpenAI.Chat.ChatCompletionMessageParam[] | undefined;




    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Capture the latest prompt sent by the user for Vector Querying
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role !== "user" || !lastUserMessage.content) {
      return Response.json({ error: "Last message must be a valid user prompt" }, { status: 400 });
    }
    
    const queryText = String(lastUserMessage.content).trim();
    const conversationHistory = messages.slice(-4);

    const {list, aboutIsland, more, single} = await classifyIntent(messages.at(-1)?.content as string, conversationHistory)

   let contextString = null

  

    if(list){
    
    await connectDB();

    // 1. Generate text embeddings targeting only the newest user question
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: queryText,
    });
    const vector = embeddingResponse.data[0].embedding;

    // 2. Optimized vector aggregation with tight projection limit 
    const docs = await Listing.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: vector,
          numCandidates: 100,
          limit: 3, // Tightened limit preserves model focus and reduces token cost
        },
      },
      {
        $project: {
          title: 1,
          category: 1,
          subCategory: 1,
          description: 1,
          contact_info: 1,
          metadata: 1,
          images: 1
        }
      }
    ]);

    // 3. Compact contextual data layout formatting
     contextString = docs
      .map((doc, idx) => {
        return `[DOC ${idx + 1}] ${doc.title} (${doc.category} in ${doc.island || "Guraidhoo"})
Category: ${doc.category}
SubCategory: ${doc.subCategory}
Details: ${doc.description}
Contact_info: ${JSON.stringify(doc.contact_info)}
Spec: ${JSON.stringify(doc.metadata)}
Photoes: ${JSON.stringify(doc.images)}
`;

      })
      .join("\n\n");
    }
  if (aboutIsland){
console.log("intention is aboutIsland")
    }
    if(more){
    console.log("intention is more")
    }
    if(single){
      console.log("intention is single")
      await connectDB()

      const keywords = single.name
  .split(/\s+/)
  .filter(Boolean);

const query = {
  $and: keywords.map(word => ({
    title: {
      $regex: word,
      $options: "i",
    },
  })),
};

      const res = await Listing.find(query)

if(res){
      contextString = res
      .map((doc, idx) => {
        return `[DOC ${idx + 1}] ${doc.title} (${doc.category} in ${doc.island || "Guraidhoo"})
Category: ${doc.category}
SubCategory: ${doc.subCategory}
Details: ${doc.description}
Contact_info: ${JSON.stringify(doc.contact_info)}
Spec: ${JSON.stringify(doc.metadata)}
Photoes:  ${JSON.stringify(doc.images)}
`;
      })

}else{
  return null
}


    }

    


    const systemInstruction = {
      role: "system" as const,
      content: `You are an AI Concierge. Answer ONLY using the context provided below. 
If the information is missing from the context, state clearly that you have no information about it. Always be clear and string. answer in short informative way.

Rules:
- Never invent businesses, prices, or operational coordinates.
- Maintain a helpful, conversational local tone.
- When neede give user google map link for location if coordinates are available (lable must me meaning full, not coordinates).
- When giving phone numbers, make sure it's clickable accordingly.
- If a place has one or more images and the user asks what it looks like, include the image(s) using Markdown:
  ![Meaningful description](IMAGE_URL "Tooltip text")
  
  CRITICAL RULE FOR IMAGE_URL: 
  - Use the exact string provided in the context. 
  - DO NOT add, alter, or prepend any domain, protocol (like https://), or placeholder text. 
  - If the path in the context is relative (e.g., "/image.jpg" or "/images/beach.jpg"), output it exactly as a relative path. Do not try to "fix" or complete the URL.

- If multiple images are available, show up to 4.
- Never invent image URLs.
Context:
${contextString}`
    };

    // Combine system prompt with recent conversation history
    const finalChatMessages = [systemInstruction, ...conversationHistory];

    // 5. Open stream configuration
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      temperature: 0.2, // Lowered temperature blocks creative fabrications
      messages: finalChatMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices?.[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
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
      { error: error.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}