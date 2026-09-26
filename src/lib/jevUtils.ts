import { noul, TypeSafeClient } from "@typesafe-ai/sdk";
export const JEV_MODEL = "jev-latest";

export const jevSdk = new TypeSafeClient({
  apiKey: process.env.JEV_API_KEY,
});

export const ROUTING_QUESTIONS = {
  intent: {
    type: "choice",
    instructions:
      "Determine whether the user's message is casual conversation or requires information.",
    criteria: {
      casual:
        "Greetings, thanks, acknowledgements, farewells, date and time, or simple small talk that does not require factual information.",
      knowledge:
        "The user wants information, recommendations, places, services, activities, prices, availability, directions, or any factual information.",
    },
  },
  date_time: {
    type: "choice",
    instructions:
      "Determine whether answering the user's message requires the current date or current time.",
    criteria: {
      required:
        "The user asks for the current date or time, asks whether something is open or available now, or refers to getting time or date in ANY language. This includes relative temporal words in English (now, today, tonight, this morning, this afternoon, tomorrow, currently), Dhivehi in Thaana script (ދެން, މިއަދު, މިރޭ, މާދަމާ, މިހާރު, އިއްޔެ, ހެނދުނު, މެންދުރު, ހަވީރު, ރޭގަނޑު, ގަޑިން, ގަޑި, ތާރީޚު, ވަގުތު, އަންނަ, ފާއިތުވި, ކުރިން, ފަހުން, ދުވަސް, ހަފްތާ, މަސް, އަހަރު), Latin transliteration (miadhu, mirey, maadhamaa, mihaaru, iyye, hendhunu, mendhuru, haveeru, reygandu, gadin, gadi, thaareekhu, vaguthu, anna, faithuvi, kurin, fahun, dhuvas, hafthaa, mas, aharu, dhen), or equivalent terms/phrases in any other language that match time.",
      not_required:
        "The user's question can be answered without knowing the current date or time.",
    },
  },
  lang: {
    type: "choice",
    instructions:
      "Classify the primary language of the user's message as either Dhivehi or another language.",
    criteria: {
      dhivehi:
        "The message is written in Dhivehi using either the Thaana script (e.g., ކިހިނެއް) or Latin/Romanized Dhivehi (e.g., 'kihineh', 'koba', 'madoadhoo'). Select this even if common English words or place names are mixed in.",
      other:
        "The message is written in any language other than Dhivehi (e.g., English, Arabic, Spanish, French).",
    },
  },
  search_type: {
    type: "choice",
    instructions: "Which option best fits the state?",
    criteria: {
      category: "If it fits to a category search",
      simentic_search: "search need symentic meaning",
      nullState: "dont need any search"
    }
  
}
} as const;
export type Intent = "casual" | "knowledge";

export type DateTimeRequirement = "required" | "not_required";

export type Language = "dhivehi" | "major";


export type RoutingResult = {
  intent: Intent;
  dateTime: DateTimeRequirement;
  lang: Language;
};

export type JevChoice = {
  type?: string;
  choice?: string;
  confidence?: number;
};

export type JevResponse = {
  answers?: {
    intent?: JevChoice;
    date_time?: JevChoice;
    lang?:JevChoice
  };
};

export async function routeWithJev(message: string): Promise<RoutingResult> {
  const { JEV_API_URL, JEV_API_KEY } = process.env;
  if (!JEV_API_URL || !JEV_API_KEY) {
    throw new Error("JEV API configurations missing.");
  }

  const response = await fetch(JEV_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JEV_API_KEY}`,
    },
    body: JSON.stringify({
      state: message,
      model: JEV_MODEL,
      questions: ROUTING_QUESTIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jev request failed (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as JevResponse;

  const data = {
    intent:
      result.answers?.intent?.choice === "casual" ? "casual" : "knowledge",
    dateTime: "required",
    lang: result.answers?.lang?.choice === "dhivehi"
        ? "dhivehi"
        : "major",
  } as const

  return data 
}

export async function jevRetrieve(query: string, data: any[]) {

  if (!data?.length) return [];

  const questions = Object.fromEntries(
    data.map((candidate: any) => [
      `${String(candidate.id)}`,
      noul(
        `Does this listing meaningfully match the user's request?\n\nUser message:\n"${query}"\n\nListing: ${JSON.stringify(
          candidate,
        )}\n\nReturn a high probability only when this listing contains information that would be useful for answering the user's request.`,
      ),
    ]),
  );

  const result = await jevSdk.systemOne({
    model: JEV_MODEL,
    state: query,
    questions,
  });

  return data.filter((candidate: any) => {
    const answer = result?.answers?.[`${String(candidate.id)}`];
    return Number(answer?.noul ?? 0) >= 0.25;
  });
}







