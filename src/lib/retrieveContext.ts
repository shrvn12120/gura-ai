import { getChatContext, saveChatContext } from "./chatContext";
import { shouldReusePreviousContext } from "./shouldReusePreviousContext";
import { vectorSearch } from "./vectorSearch";

type RetrieveContextParams = {
  sessionId: string;
  query: string;
  history: {
    role: string;
    content: any;
  }[];
};

export async function retrieveContext({
  sessionId,
  query,
  history,
}: RetrieveContextParams) {
  const previous = await getChatContext(sessionId);


  if (previous) {
    const shouldReuse = await shouldReusePreviousContext({
      query,
      previousContext: previous,
      history,
    });

    if (shouldReuse) {
      return previous.results;
    }else{
        const results = await vectorSearch(query);
          return results;
    }
  }else{

  const results = await vectorSearch(query);

  await saveChatContext({
    sessionId,
    query,
    results,
  });

  return results;
  }


}