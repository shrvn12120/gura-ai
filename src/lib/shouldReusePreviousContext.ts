import Fuse from "fuse.js";

type Params = {
  query: string;
  previousContext: any;
  history: any[];
};

export async function shouldReusePreviousContext({
  query,
  previousContext,
}: Params): Promise<boolean> {

  if (!previousContext?.results?.length) {
    return false;
  }

  // Build searchable documents from previous results
  const documents = previousContext.results.map((item: any) => ({
    id: item.id,

    text: [
      item.title,
      item.category,
      item.subCategory,
      item.description,
      JSON.stringify(item.metadata ?? {}),
    ]
      .filter(Boolean)
      .join(" "),
  }));

  const fuse = new Fuse(documents, {
    keys: ["text"],
    threshold: 0.35, // tune between 0.2–0.5
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const matches = fuse.search(query);

  if (matches.length === 0) {
    return false;
  }

  return (matches[0].score ?? 1) <= 0.35;
}