// import { getChatContext, saveChatContext } from "./chatContext";
// import { shouldReusePreviousContext } from "./shouldReusePreviousContext";
// import { vectorSearch } from "./vectorSearch";

// type RetrieveContextParams = {
//   sessionId: string;
//   query: string;
//   history: {
//     role: string;
//     content: any;
//   }[];
// };

// export async function retrieveContext({
//   sessionId,
//   query,
//   history,
// }: RetrieveContextParams) {
//   const previous = await getChatContext(sessionId);


//   if (previous) {
//     const shouldReuse = await shouldReusePreviousContext({
//       query,
//       previousContext: previous,
//       history,
//     });

//     if (shouldReuse) {
//       return previous.results;
//     }else{
//         const results = await vectorSearch(query);
//           return results;
//     }
//   }else{

//   const results = await vectorSearch(query);

//   await saveChatContext({
//     sessionId,
//     query,
//     results,
//   });

//   return results;
//   }


// }

// ============ new code =============

// import OpenAI from "openai";

// import {
//   getChatContext,
//   saveChatContext,
// } from "./chatContext";

// import {
//   getRetrievalDecision,
// } from "./shouldReusePreviousContext";

// import {
//   vectorSearch,
// } from "./vectorSearch";

// type RetrieveContextParams = {
//   sessionId: string;

//   query: string;

//   history:
//     OpenAI.Chat.ChatCompletionMessageParam[];
// };

// export async function retrieveContext({
//   sessionId,
//   query,
//   history,
// }: RetrieveContextParams) {
//   const previous =
//     await getChatContext(
//       sessionId,
//     );

//   /*
//    * --------------------------------------------------
//    * First question
//    * --------------------------------------------------
//    */

//   if (!previous) {
//     const results =
//       await vectorSearch(query);

//     await saveChatContext({
//       sessionId,
//       query,
//       results,
//     });

//     return results;
//   }

//   /*
//    * --------------------------------------------------
//    * Decide retrieval strategy
//    * --------------------------------------------------
//    */

//   const decision =
//     getRetrievalDecision({
//       query,

//       previousContext: {
//         lastQuery:
//           previous.lastQuery,

//         results:
//           previous.results,
//       },
//     });
//   /*
//    * --------------------------------------------------
//    * REUSE
//    *
//    * No embedding.
//    * No vector search.
//    * --------------------------------------------------
//    */

//   if (
//     decision.type ===
//     "reuse"
//   ) {
//     return previous.results;
//   }

//   /*
//    * --------------------------------------------------
//    * CONTEXTUAL SEARCH
//    *
//    * Important:
//    *
//    * The previous entity is included in the query.
//    *
//    * Example:
//    *
//    * H78 Guraidhoo
//    * +
//    * restaurant cafe nearby
//    *
//    * --------------------------------------------------
//    */

//   if (
//     decision.type ===
//     "contextual"
//   ) {
//     const results =
//       await vectorSearch(
//         decision.query,
//       );

//     await saveChatContext({
//       sessionId,

//       /*
//        * Save the contextual retrieval
//        * query as the new context.
//        */
//       query:
//         decision.query,

//       results,
//     });

//     return results;
//   }

//   /*
//    * --------------------------------------------------
//    * NEW TOPIC
//    * --------------------------------------------------
//    */

//   const results =
//     await vectorSearch(
//       decision.query,
//     );

//   await saveChatContext({
//     sessionId,

//     query:
//       decision.query,

//     results,
//   });

//   return results;
// }


import OpenAI from "openai";

import {
  getChatContext,
  saveChatContext,
} from "./chatContext";

import {
  getRetrievalDecision,
} from "./shouldReusePreviousContext";

import {
  vectorSearch,
} from "./vectorSearch";

import {
  buildContextualQuery,
} from "./buildContextualQuery";


type RetrieveContextParams = {
  sessionId: string;

  query: string;

  history:
    OpenAI.Chat.ChatCompletionMessageParam[];
};


export async function retrieveContext({
  sessionId,
  query,
  history,
}: RetrieveContextParams) {

  const previous =
    await getChatContext(sessionId);


  /*
   * --------------------------------------------------
   * FIRST QUESTION
   * --------------------------------------------------
   */

  if (!previous) {

    const results =
      await vectorSearch(query);

    await saveChatContext({
      sessionId,
      query,
      results,
    });

    return results;
  }


  /*
   * --------------------------------------------------
   * DECIDE RETRIEVAL STRATEGY
   * --------------------------------------------------
   */

  const decision =
    getRetrievalDecision({
      query,

      previousContext: {
        lastQuery:
          previous.lastQuery,

        results:
          previous.results,
      },
    });


  /*
   * --------------------------------------------------
   * REUSE
   *
   * No embedding.
   * No vector search.
   * --------------------------------------------------
   */

  if (
    decision.type === "reuse"
  ) {

    return previous.results;
  }


  /*
   * --------------------------------------------------
   * CONTEXTUAL SEARCH
   *
   * Convert:
   *
   * "Do they deliver?"
   *
   * into:
   *
   * "The Island Cafe Do they deliver?"
   *
   * --------------------------------------------------
   */

  if (
    decision.type === "contextual"
  ) {

    const contextualQuery =
      buildContextualQuery({
        query: decision.query,

        previousQuery:
          previous.lastQuery,

        previousResults:
          previous.results,
      });


    const results =
      await vectorSearch(
        contextualQuery,
      );


    await saveChatContext({
      sessionId,

      /*
       * IMPORTANT:
       * Save the meaningful query,
       * not the original short question.
       */

      query:
        contextualQuery,

      results,
    });


    return results;
  }


  /*
   * --------------------------------------------------
   * NEW TOPIC
   * --------------------------------------------------
   */

  const results =
    await vectorSearch(
      decision.query,
    );


  await saveChatContext({
    sessionId,

    query:
      decision.query,

    results,
  });


  return results;
}