// import Fuse from "fuse.js";

// type Params = {
//   query: string;
//   previousContext: any;
//   history: any[];
// };

// export async function shouldReusePreviousContext({
//   query,
//   previousContext,
// }: Params): Promise<boolean> {

//   if (!previousContext?.results?.length) {
//     return false;
//   }

//   // Build searchable documents from previous results
//   const documents = previousContext.results.map((item: any) => ({
//     id: item.id,

//     text: [
//       item.title,
//       item.category,
//       item.subCategory,
//       item.description,
//       JSON.stringify(item.metadata ?? {}),
//     ]
//       .filter(Boolean)
//       .join(" "),
//   }));

//   const fuse = new Fuse(documents, {
//     keys: ["text"],
//     threshold: 0.35, // tune between 0.2–0.5
//     ignoreLocation: true,
//     minMatchCharLength: 2,
//   });

//   const matches = fuse.search(query);

//   if (matches.length === 0) {
//     return false;
//   }

//   return (matches[0].score ?? 1) <= 0.35;
// }

import Fuse from "fuse.js";

type PreviousContext = {
  lastQuery?: string;
  results?: any[];
};

type RetrievalDecision =
  | {
      type: "reuse";
    }
  | {
      type: "contextual";
      query: string;
    }
  | {
      type: "new";
      query: string;
    };

type Params = {
  query: string;
  previousContext: PreviousContext;
};

/*
 * Words that usually indicate the user is
 * referring to something from the previous turn.
 */
const REFERENCE_PATTERNS = [
  /\bit\b/i,
  /\bits\b/i,
  /\bthis\b/i,
  /\bthat\b/i,
  /\bthey\b/i,
  /\bthem\b/i,
  /\bthere\b/i,
  /\bnearby\b/i,
  /\bnear\b/i,
  /\bwhich one\b/i,
  /\bwhat about\b/i,
  /\bhow much\b/i,
  /\bhow far\b/i,
  /\bis it\b/i,
  /\bcan it\b/i,
  /\bdoes it\b/i,
  /\bdo they\b/i,
  /\bare they\b/i,
];

/*
 * These questions usually require NEW information
 * even though they are about the same entity.
 *
 * Example:
 *
 * "Where is H78?"
 *
 * "Is there a restaurant nearby?"
 *
 * We must search again, but preserve H78 as context.
 */
const INFORMATION_REQUEST_PATTERNS = [
  /\brestaurant\b/i,
  /\brestaurants\b/i,
  /\bcafe\b/i,
  /\bcafes\b/i,
  /\bbeach\b/i,
  /\bbeaches\b/i,
  /\bactivity\b/i,
  /\bactivities\b/i,
  /\bhotel\b/i,
  /\bhotels\b/i,
  /\bguesthouse\b/i,
  /\bguesthouses\b/i,
  /\bshop\b/i,
  /\bshops\b/i,
  /\bstore\b/i,
  /\bstores\b/i,
  /\bpharmacy\b/i,
  /\bclinic\b/i,
  /\bmosque\b/i,
  /\bdiving\b/i,
  /\bsnorkeling\b/i,
  /\btransport\b/i,
  /\bferry\b/i,
  /\bspeedboat\b/i,
];

/*
 * Extract useful entity information from the previous
 * retrieved context.
 *
 * This does NOT use AI.
 */
function extractPreviousEntity(
  previousContext: PreviousContext,
): string {
  const results = previousContext.results;

  if (!Array.isArray(results) || results.length === 0) {
    return "";
  }

  /*
   * Prefer the first result because vector search
   * normally puts the most relevant result first.
   */
  const first = results[0];

  if (!first) {
    return "";
  }

  const entityParts = [
    first.title,
    first.name,
    first.category,
    first.subCategory,
    first.subcategory,
  ].filter(Boolean);



  return entityParts.join(" ");
}

/*
 * Does the question explicitly refer to the
 * previous context?
 */
function hasReferenceLanguage(
  query: string,
): boolean {
  return REFERENCE_PATTERNS.some(
    (pattern) => pattern.test(query),
  );
}

/*
 * Does the question ask for a different type of
 * information?
 */
function asksForNewInformation(
  query: string,
): boolean {
  return INFORMATION_REQUEST_PATTERNS.some(
    (pattern) => pattern.test(query),
  );
}

export function getRetrievalDecision({
  query,
  previousContext,
}: Params): RetrievalDecision {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return {
      type: "new",
      query: cleanQuery,
    };
  }

  const results =
    previousContext?.results;

  /*
   * No previous context.
   */
  if (
    !Array.isArray(results) ||
    results.length === 0
  ) {
    return {
      type: "new",
      query: cleanQuery,
    };
  }

  /*
   * Get entity from previous retrieval.
   */
  const previousEntity =
    extractPreviousEntity(
      previousContext,
    );

  /*
   * --------------------------------------------------
   * CASE 1
   *
   * User explicitly refers to previous context,
   * AND asks for new information.
   *
   * Example:
   *
   * "Where is H78?"
   * "Is there a restaurant nearby?"
   *
   * → contextual search
   * --------------------------------------------------
   */

  if (
    previousEntity &&
    hasReferenceLanguage(cleanQuery) &&
    asksForNewInformation(cleanQuery)
  ) {
    return {
      type: "contextual",

      query: [
        previousEntity,
        cleanQuery,
      ].join(" "),
    };
  }

  /*
   * --------------------------------------------------
   * CASE 2
   *
   * Explicit follow-up but doesn't require
   * a new category of information.
   *
   * Example:
   *
   * "Where is H78?"
   * "Is it on Carnation Magu?"
   *
   * Existing H78 document may already contain
   * the answer.
   *
   * → reuse
   * --------------------------------------------------
   */

  if (
    hasReferenceLanguage(cleanQuery) &&
    !asksForNewInformation(cleanQuery)
  ) {
    return {
      type: "reuse",
    };
  }

  /*
   * --------------------------------------------------
   * CASE 3
   *
   * Search previous documents with Fuse.
   *
   * This catches queries that explicitly mention
   * the same entity/category.
   * --------------------------------------------------
   */

  const documents =
    results.map((item: any) => ({
      id: item.id,

      text: [
        item.title,
        item.name,
        item.category,
        item.subCategory,
        item.subcategory,
        item.description,
        item.contact_info,
        JSON.stringify(
          item.metadata ?? {},
        ),
      ]
        .filter(Boolean)
        .join(" "),
    }));

  if (documents.length > 0) {
    const fuse =
      new Fuse(documents, {
        keys: ["text"],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      });

    const matches =
      fuse.search(cleanQuery);

    if (
      matches.length > 0 &&
      (matches[0].score ?? 1) <= 0.35
    ) {
      /*
       * It matches existing documents.
       *
       * Reuse them.
       */
      return {
        type: "reuse",
      };
    }
  }

  /*
   * --------------------------------------------------
   * CASE 4
   *
   * Completely new topic.
   * --------------------------------------------------
   */

  return {
    type: "new",
    query: cleanQuery,
  };
}