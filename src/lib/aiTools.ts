
// import OpenAI from "openai";

// export const aiTools: OpenAI.Responses.FunctionTool[] = [
//   {
//     type: "function",

//     name: "search_guraidhoo",

//     description: `
// Search the Guraidhoo knowledge base.

// Use this tool ONLY when the information needed to answer
// the user's current request is not already available in
// the conversation.

// Prefer existing conversation information.

// Use this tool when the user:
// - asks for new information
// - asks for another/different option
// - asks for information not previously provided
// - asks about something that requires factual knowledge
//   not available in the conversation
// `,

//     strict: true,

//     parameters: {
//       type: "object",

//       properties: {
//         query: {
//           type: "string",

//           description:
//             "A precise search query describing the information currently needed.",
//         },
//       },

//       required: ["query"],

//       additionalProperties: false,
//     },
//   },
// ];

import OpenAI from "openai";

export const aiTools: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",

    name: "search_guraidhoo",

    description: `
Search the Guraidhoo knowledge base.

Use this tool ONLY when the information needed to answer
the user's current request is not already available in
the conversation.

Prefer existing conversation information.

Use this tool when the user:
- asks for new information
- asks for another/different option
- asks for information not previously provided
- asks about something that requires factual knowledge
  not available in the conversation
`,

    strict: true,

    parameters: {
      type: "object",

      properties: {
        query: {
          type: "string",

          description:
            "A precise search query describing the information currently needed.",
        },
        limit: {
          type: "integer",

          description:
            "The maximum number of results to return. Use a higher number (e.g., 8-12) if the user is asking for a list, directory, or multiple options. Use a lower number (e.g., 2-4) if looking for a specific single place.",
        },
      },

      // Since strict: true requires every property to be listed in `required`,
      // you must include "limit" here. The model will automatically choose an appropriate value.
      required: ["query", "limit"],

      additionalProperties: false,
    },
  },
];