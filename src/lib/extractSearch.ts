// import OpenAI from "openai";
// import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";


// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });


// export type SearchIntent = {

//   language: string;

//   searchType:
//     | "place"
//     | "category"
//     | "semantic";

//   keywords: string[];

//   place: string | null;
//   limit: number

// };



// export async function extractSearch(
//   message: string,
//   history: ChatCompletionMessageParam[] = []
// ): Promise<SearchIntent> {


//   const conversation =
//     history
//       .map((m)=>{

//         if(typeof m.content !== "string")
//           return "";

//         return `${m.role}: ${m.content}`;

//       })
//       .filter(Boolean)
//       .join("\n");



//   const response =
//     await openai.chat.completions.create({

//       model:"gpt-4o-mini",

//       temperature:0,


//       response_format:{
//         type:"json_object"
//       },


//       messages:[

//         {
//           role:"system",

//           content:`
// You are a search query analyzer for Explore Guraidhoo AI.

// Your job:
// Analyze the user's message and prepare database search information.

// Return ONLY JSON.

// Schema:

// {
//  "language": "en",
//  "searchType": "place | category | semantic",
//  "keywords": [],
//  "place": null
//  "limit": number
// }


// Rules:

// 1. Detect the user's language.

// 2. keywords:
// - Always return keywords in English.
// - Convert Dhivehi, Chinese, Arabic, etc. into English search terms.
// - Keep keywords short.

// 3. place:
// - If the user refers to a specific business/place/location, return its name.
// - If no specific place exists, return null.

// 4. searchType:

// Use "place" when:
// - User asks about a specific listing.
// - Example:
//   "Tell me about Silver Fin"
//   "Where is Rustic Villa?"

// Use "category" when:
// - User wants a list/type of things.
// - Example:
//   "restaurants"
//   "guesthouses"
//   "beaches"
//   "buggy/golf cart/taix"
// - Buggy/Golf cart/Taix = "Buggy" iand its a mode of inland transportaion 
// - If user wants list of all make limit to 100

// Use "semantic" when:
// - User describes a need, feeling, recommendation, or question.
// - Example:
//   "best place for kids"
//   "quiet place for honeymoon"
//   "where can I watch sunset"





// Important:
// - Use previous conversation context.
// - Resolve words like:
//   "they"
//   "it"
//   "there"
//   "that place"
//   "nearby"
//   "another one"

// If the user only greets:
// Return:

// {
//  "language":"detected",
//  "searchType":"semantic",
//  "keywords":[],
//  "place":null,
//  limit: 8
// }

// `
//         },


//         ...(conversation
//           ? [
//               {
//                 role:"system" as const,
//                 content:
// `Previous conversation:

// ${conversation}`
//               }
//             ]
//           : []
//         ),



//         {
//           role:"user",

//           content:message

//         }

//       ]

//     });



//   const result =
//     JSON.parse(
//       response.choices[0].message.content || "{}"
//     );



//   return {

//     language:
//       result.language || "en",


//     searchType:
//       result.searchType || "semantic",


//     keywords:
//       Array.isArray(result.keywords)
//         ? result.keywords
//         : [],


//     place:
//       result.place || null,
//       limit: result.limit || 8

//   };

// }

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export type SearchIntent = {

  language: string;

  searchType:
    | "place"
    | "category"
    | "semantic";

  keywords: string[];

  place: string | null;

  limit: number;

  confidence:number;

};


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});


const SYSTEM_PROMPT = `

You are a search intent classifier for Explore Guraidhoo AI.

Return ONLY JSON.

Schema:

{
 "language":"en",
 "searchType":"place|category|semantic",
 "keywords":[],
 "place":null,
 "limit":8,
 "confidence":0.0
}


Rules:

Language:
- Detect user language.

Keywords:
- Always English.
- Translate Dhivehi, Chinese, Arabic etc.
- Keep short search terms.

Classification:

place:
Specific listing/business/location.

Example:
"Tell me about Silver Fin"
"Where is Rustic Villa?"

category:
User wants a group/list.

Examples:
"restaurants"
"guesthouses"
"beaches"
"transport"

semantic:
User wants recommendation or describes a need.

Examples:
"best place for sunset"
"quiet place"
"good for kids"


Limits:
- category list request = 100
- normal search = 8


If unclear:
searchType="semantic"


`;


export async function extractSearch(
  message:string,
  history:ChatCompletionMessageParam[]=[]
):Promise<SearchIntent>{


  // Only keep recent context
  const recentHistory =
    history
      .slice(-4)
      .map(m=>{

        if(typeof m.content !== "string")
          return "";

        return `${m.role}: ${m.content}`;

      })
      .filter(Boolean)
      .join("\n");



  const response =
    await openai.chat.completions.create({

      model:"gpt-4o-mini",

      temperature:0,


      response_format:{
        type:"json_object"
      },


      messages:[

        {
          role:"system",
          content:SYSTEM_PROMPT
        },


        ...(recentHistory
          ? [
            {
              role:"system" as const,
              content:
`Recent context:
${recentHistory}`
            }
          ]
          : []
        ),


        {
          role:"user",
          content:message
        }

      ]

    });



  let result:any={};


  try{

    result =
      JSON.parse(
        response.choices[0]
          .message
          .content || "{}"
      );

  }
  catch{

    result={};

  }



  return {

    language:
      result.language || "en",


    searchType:
      [
        "place",
        "category",
        "semantic"
      ].includes(result.searchType)
        ? result.searchType
        : "semantic",


    keywords:
      Array.isArray(result.keywords)
        ? result.keywords
        : [],


    place:
      result.place || null,


    limit:
      result.limit === 100
        ? 100
        : 8,


    confidence:
      typeof result.confidence === "number"
        ? result.confidence
        : 0.5

  };

}