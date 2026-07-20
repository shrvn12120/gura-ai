import { NextRequest } from "next/server";
import OpenAI from "openai";
import { classifyIntent, retrieveContext } from "@/app/action";

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

    // const {list, aboutIsland, more, single} 
   const intent = await classifyIntent(messages.at(-1)?.content as string, conversationHistory)


   const x = await retrieveContext(intent, queryText)




//     if(list){
    
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
//           limit: 4, // Tightened limit preserves model focus and reduces token cost
//            filter: {
//             active: true,
//           },
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
//           images: 1
//         }
//       }
//     ]);

   

//     // 3. Compact contextual data layout formatting
//      contextString = docs
//       .map((doc, idx) => {
//         return `[DOC ${idx + 1}] ${doc.title} (${doc.category} in ${doc.island || "Guraidhoo"})
// Category: ${doc.category}
// SubCategory: ${doc.subCategory}
// Details: ${doc.description}
// Contact_info: ${JSON.stringify(doc.contact_info)}
// Spec: ${JSON.stringify(doc.metadata)}
// Photoes: ${JSON.stringify(doc.images)}
// `;

//       })
//       .join("\n\n");
//     }
//     if(single){
//       await connectDB()

//       const keywords = single.name
//   .split(/\s+/)
//   .filter(Boolean);

// const query = {
//   $and: keywords.map(word => ({
//     title: {
//       $regex: word,
//       $options: "i",
//     },
//   })),
// };

//       const res = await Listing.find(query)

// if(res){
//       contextString = res
//       .map((doc, idx) => {
//         return `[DOC ${idx + 1}] ${doc.title} (${doc.category} in ${doc.island || "Guraidhoo"})
// Category: ${doc.category}
// SubCategory: ${doc.subCategory}
// Details: ${doc.description}
// Contact_info: ${JSON.stringify(doc.contact_info)}
// Spec: ${JSON.stringify(doc.metadata)}
// Photoes:  ${JSON.stringify(doc.images)}
// `;
//       })

// }else{
//   contextString=``
// }


//     }

    
  

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
  
CRITICAL RULE FOR IMAGE_URL

- Output IMAGE_URL exactly as stored in the context.
- Do NOT modify, reconstruct, or normalize the URL.
- Do NOT change the domain, filename, path, capitalization, query parameters, or extension.
- Do NOT replace the ImageKit URL with another URL.
- If no suitable image exists in the current context, tell there is no image to give.

IMAGE SELECTION

- If the listing contains multiple images, choose the SINGLE image that best matches the user's request.
- Match the user's request against each image's "alt" text.
- If an image's alt text  matches the requested subject, use that image.
- If multiple images match, choose the most specific match.
- If no alt text matches, choose the most representative image of the listing.
- Never choose an unrelated image simply because one exists.
- If multiple images are available, show up to 3.
- Never invent image URLs.

URL OUTPUT

- Output IMAGE_URL exactly as stored in the context.
- If the stored value is a relative path, return the relative path exactly as provided.
- If the stored value is a full ImageKit URL (https://ik.imagekit.io/...), return the full URL exactly as provided.
- Never prepend, append, or modify any part of the URL.
Context:
${x}`
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
