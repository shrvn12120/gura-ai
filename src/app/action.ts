"use server";

// import { CATEGORY_SUBCATEGORY_META_CONFIGS } from "@/lib/categories.config";
// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });


// const categoryText = Object.entries(CATEGORY_SUBCATEGORY_META_CONFIGS)
//   .map(([category, subCategories]) => {
//     const subs = Object.keys(subCategories)
//       .filter((sub) => sub !== "default")
//       .map((sub) => `  ${sub}`)
//       .join("\n");

//     return `${category}:\n${subs}`;
//   })
//   .join("\n\n");



// const classifierPrompt = `
// You are an intent classifier for a single island Maldives travel assistant.

// Analyze the user's message and return ONLY valid JSON.

// You must choose exactly one:
// * Tax/buugy/golf cart is { category: 'transport', subCategory: 'in-land' }.

// 1. aboutIsland
// - true when the user asks general information about the island.
// - list and more must be null.

// 2. list
// - use when user wants recommendations, suggestions, or semantic discovery.
// - Examples:
//   "Recommend guest houses"
//   "Best restaurants"
//   "Where should I stay?"
// - more must be null.

// 3. more
// - use when user wants a complete listing, any type of all.
// - Examples:
//   "Show all restaurants"
//   "List all guest houses"
//   "Give list of all buggy phone number"
// - list must be null.

// 4. single
// - when user want single or a specefic type information.
// - Examples:
//   "where is A cafe"
//   "where is --certain-- type/place/activity"
//   "When a user asks to locate, guide them to, or find a specific place (e.g., 'where is H72', 'guide me to Rustic', 'find Amore/Bikini Beach')"
// - more must be null.

// Categories:
// ${
//   categoryText  
// }
// -Make sure subCategorie is in correct category

// Return format:

// {
//   "list": {
//     "category": "",
//     "subCategory": ""
//   } | null,

//   "aboutIsland": boolean,

//   "more": {
//     "category": "",
//     "subCategory": ""
//   } | null

//   "single": {
//     "name": "in lowercase",
//   } | null
// }

// Rules:
// - If aboutIsland is true, list,more and single must be null.
// - Never return both list and more or more and single.
// - If unsure, return all null except aboutIsland false.
// - One intention is clear, dont change unless user get what he is tring.
// `;

// export type IntentClassification = {
//   list: {
//     category: string;
//     subCategory: string;
//   } | null;

//   aboutIsland: boolean;

//   more: {
//     category: string;
//     subCategory: string;
//   } | null;
//   single: {
//     name: string
//   } | null;
// };


// export async function classifyIntent(
//   message: string,
//   conversation: OpenAI.Chat.ChatCompletionMessageParam[]
// ): Promise<IntentClassification> {


//   try {
//     const response = await openai.responses.create({
//       model: "gpt-4.1-nano",

//       input: [
//         {
//           role: "system",
//           content: classifierPrompt,
//         },
//         {
//           role: "user",
//           content: message,
//         },
//       ],

//       text: {
//         format: {
//           type: "json_schema",
//           name: "intent_classifier",
//           strict: true,
//           schema: {
//             type: "object",
//             additionalProperties: false,

//             properties: {
//               list: {
//                 type: ["object", "null"],
//                 properties: {
//                   category: {
//                     type: "string",
//                   },
//                   subCategory: {
//                     type: "string",
//                   },
//                 },
//                 required: [
//                   "category",
//                   "subCategory",
//                 ],
//                 additionalProperties: false,
//               },

//               aboutIsland: {
//                 type: "boolean",
//               },

//               more: {
//                 type: ["object", "null"],
//                 properties: {
//                   category: {
//                     type: "string",
//                   },
//                   subCategory: {
//                     type: "string",
//                   },
//                 },
//                 required: [
//                   "category",
//                   "subCategory",
//                 ],
//                 additionalProperties: false,
//               },
//                single: {
//                 type: ["object", "null"],
//                 properties: {
//                      name: {
//                     type: "string",
//                   }
//                 },
//                 required: [
//                   "name"
//                 ],
//                 additionalProperties: false,
//               },
//             },

//             required: [
//               "list",
//               "aboutIsland",
//               "more",
//               "single"
//             ],
//           },
//         },
//       },
//     });


//     return JSON.parse(
//       response.output_text
//     ) as IntentClassification;


//   } catch (error) {
//     console.error(
//       "Intent classification error:",
//       error
//     );

//     return {
//       list: null,
//       aboutIsland: false,
//       more: null,
//       single: null
//     };
//   }
// }

import { CATEGORY_SUBCATEGORY_META_CONFIGS } from "@/lib/categories.config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const categoryText = Object.entries(CATEGORY_SUBCATEGORY_META_CONFIGS)
  .map(([category, subCategories]) => {
    const subs = Object.keys(subCategories)
      .filter((sub) => sub !== "default")
      .map((sub) => `  ${sub}`)
      .join("\n");

    return `${category}:\n${subs}`;
  })
  .join("\n\n");

const classifierPrompt = `
You are an intent classifier for a single island Maldives travel assistant.
Analyze the user's latest message considering the provided conversation history and return a structured JSON response.

You must choose exactly one intent:
* Tax/buggy/golf cart is { category: 'transport', subCategory: 'in-land' }.

1. aboutIsland
- true when the user asks general information about the island.


2. list
- use when user wants recommendations, suggestions, or semantic discovery.
- Examples: "Recommend guest houses", "Best restaurants", "Where should I stay?", "i dont know where am stying"
- If the user is finding unknown things/places/types.
- If user is looking for a place near/next/infront of a certain near/next/infront



3. more
- use when user wants a complete listing, any type of all.
- Examples: "Show all restaurants", "List all guest houses", "Give list of all buggy phone number"


4. single
- when user want single or a specific type information.
- Examples: "where is A cafe", "where is --certain-- type/place/activity", "When a user asks to locate, guide them to, or find a specific place (e.g., 'where is H72', 'guide me to Rustic', 'find Amore/Bikini Beach')"


Categories:
${categoryText}
- Make sure subCategory is in the correct category.

Rules:
- If aboutIsland is true; list, more, and single must be null.
- Never return both list and more...., Only one structure can be active.
- If unsure, return all null except aboutIsland false.
- Keep the user's true intent stable across turns unless they explicitly change what they are trying to do.
  Examples:
  user: "whats the nearest A to B",
  assistant: "The nearest A to B is C",
  user: "can i get phone number?" => your smart to know its C user is refering.

`;

export type IntentClassification = {
  list: {
    category: string;
    subCategory: string;
  } | null;
  aboutIsland: boolean;
  more: {
    category: string;
    subCategory: string;
  } | null;
  single: {
    name: string;
  } | null;
};

export async function classifyIntent(
  message: string,
  conversation: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<IntentClassification> {
  try {
    // 1. Build the complete message history with the classification system instructions first
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: classifierPrompt,
      },
      ...conversation, // Spreads previous back-and-forth turns
      {
        role: "user",
        content: message, // Appends the latest message to classify
      },
    ];

    // 2. Execute the completion using strict JSON schema validation
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Standard chat completion models work best with conversation parameters
      messages: messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "intent_classifier",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              list: {
                type: ["object", "null"],
                properties: {
                  category: { type: "string" },
                  subCategory: { type: "string" },
                },
                required: ["category", "subCategory"],
                additionalProperties: false,
              },
              aboutIsland: { type: "boolean" },
              more: {
                type: ["object", "null"],
                properties: {
                  category: { type: "string" },
                  subCategory: { type: "string" },
                },
                required: ["category", "subCategory"],
                additionalProperties: false,
              },
              single: {
                type: ["object", "null"],
                properties: {
                  name: { type: "string", description: "try to get the best name of place/type/activity from the user message." },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
            required: ["list", "aboutIsland", "more", "single"],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response from OpenAI");

    return JSON.parse(content) as IntentClassification;
  } catch (error) {
    console.error("Intent classification error:", error);
    return {
      list: null,
      aboutIsland: false,
      more: null,
      single: null,
    };
  }
}


