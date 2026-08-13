type ListingContext = {
  title?: string;
  category?: string;
  subCategory?: string;
};

function extractListings(
  results: string,
): ListingContext[] {
  if (!results) {
    return [];
  }

  const listings: ListingContext[] = [];

  /*
   * Extract the fields produced by formatListings().
   */

  const blocks = results.split(
    /\n\s*---\s*\n/,
  );

  for (const block of blocks) {
    const title =
      block.match(
        /- Name:\s*(.+)/i,
      )?.[1]?.trim();

    const category =
      block.match(
        /- Category:\s*(.+)/i,
      )?.[1]?.trim();

    const subCategory =
      block.match(
        /- Sub Category:\s*(.+)/i,
      )?.[1]?.trim();

    if (title) {
      listings.push({
        title,
        category,
        subCategory,
      });
    }
  }

  return listings;
}


/*
 * Detect very short contextual questions.
 *
 * Examples:
 *
 * "do they deliver?"
 * "is it expensive?"
 * "any other?"
 * "how much?"
 * "where is it?"
 */

function isShortFollowUp(query: string) {
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.length <= 8;
}


function buildContextualQuery({
  query,
  previousQuery,
  previousResults,
}: {
  query: string;
  previousQuery: string;
  previousResults: string;
}) {
  const cleanQuery = query.trim();

  const listings =
    extractListings(previousResults);

  if (listings.length === 0) {
    return cleanQuery;
  }

  const listing = listings[0];

  const entity =
    listing.title?.trim();

  if (!entity) {
    return cleanQuery;
  }

  const lower =
    cleanQuery.toLowerCase();

  /*
   * --------------------------------------------------
   * "Any other?"
   * --------------------------------------------------
   */

  if (
    /^(any other|anything else|other ones|more options|more)$/i.test(
      cleanQuery,
    )
  ) {
    const subject =
      listing.category ||
      listing.subCategory ||
      "options";

    return `other ${subject}`;
  }

  /*
   * --------------------------------------------------
   * Delivery
   *
   * "Do they deliver?"
   * "Do they do delivery?"
   * --------------------------------------------------
   */

  if (
    lower.includes("deliver") ||
    lower.includes("delivery")
  ) {
    return `${entity} delivery`;
  }

  /*
   * --------------------------------------------------
   * Price
   *
   * "How much?"
   * "How much does it cost?"
   * "What's the price?"
   * --------------------------------------------------
   */

  if (
    lower.includes("how much") ||
    lower.includes("price") ||
    lower.includes("cost") ||
    lower.includes("expensive")
  ) {
    return `${entity} price cost`;
  }

  /*
   * --------------------------------------------------
   * Location
   * --------------------------------------------------
   */

  if (
    lower.includes("where") ||
    lower.includes("location") ||
    lower.includes("located") ||
    lower.includes("address")
  ) {
    return `${entity} location address`;
  }

  /*
   * --------------------------------------------------
   * Opening hours
   * --------------------------------------------------
   */

  if (
    lower.includes("open") ||
    lower.includes("opening") ||
    lower.includes("hours") ||
    lower.includes("close")
  ) {
    return `${entity} opening hours`;
  }

  /*
   * --------------------------------------------------
   * Phone / contact
   * --------------------------------------------------
   */

  if (
    lower.includes("phone") ||
    lower.includes("number") ||
    lower.includes("contact") ||
    lower.includes("whatsapp")
  ) {
    return `${entity} contact phone whatsapp`;
  }

  /*
   * --------------------------------------------------
   * Generic contextual question
   * --------------------------------------------------
   */

  if (isShortFollowUp(cleanQuery)) {
    return `${entity} ${cleanQuery}`;
  }

  return cleanQuery;
}


export {
  buildContextualQuery,
};