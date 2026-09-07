export const searchGuraidhooTool = {
  type: "function" as const,

  name: "search_guraidhoo",

  description:
    "Search the Guraidhoo knowledge base for accurate local information. Use this tool whenever the user asks about Guraidhoo businesses, restaurants, accommodation, activities, attractions, transportation, services, places, prices, contact information, or other specific local information.",

  parameters: {
    type: "object" as const,

    properties: {
      query: {
        type: "string" as const,
        description:
          "A concise search query for the Guraidhoo knowledge base.",
      },

      limit: {
        type: "number" as const,
        description:
          "Maximum number of results to return. Use between 1 and 10.",
      },
    },

    required: ["query"],
  },
};