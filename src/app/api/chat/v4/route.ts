import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { NextRequest } from "next/server";

import { vectorSearch } from "@/lib/vectorSearch";
import { CASUAL_SYSTEM_PROMPT, SYSTEM_PROMPT } from "@/lib/aiPrompt";
import { logGeminiRequest } from "@/lib/logGeminiRequest";
import {
  DateTimeRequirement,
  Intent,
  jevRetrieve,
  Language,
  routeWithJev,
  RoutingResult,
} from "@/lib/jevUtils";

const GEMINI_MODEL = "gemini-3.7-flash";
const OPENAI_MODEL = "gpt-5.6-luna";

const RAG_LIMIT = 10;
const MAX_TOOL_LOOPS = 3;

const googleAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =========================================================
   RAG
========================================================= */

function cleanSearchResults(results: any[]) {
  return results.map((result) => {
    const contact =
      (result.contactInfo as Record<string, any>) || {};

    const cleanObject: Record<string, any> = {
      title: result.title,
      description: result.description,
    };

    if (contact.address) {
      cleanObject.address = contact.address;
    }

    if (
      Array.isArray(result.images) &&
      result.images.length > 0
    ) {
      cleanObject.formatted_images =
        result.images.map(
          (img: { alt: string; url: string }) =>
            `![${img.alt}](${img.url})`,
        );
    }

    if (contact.phone) {
      cleanObject.formatted_phone =
        `[${contact.phone}](tel:${contact.phone.replace(/\s+/g, "")})`;
    }

    if (contact.whatsapp) {
      cleanObject.whatsapp = contact.whatsapp;
    }

    if (contact.email) {
      cleanObject.formatted_email =
        `[${contact.email}](mailto:${contact.email})`;
    }

    if (
      Array.isArray(contact.socials) &&
      contact.socials.length > 0
    ) {
      const validSocials = contact.socials
        .filter(
          (social: { link?: string }) =>
            Boolean(social.link),
        )
        .map(
          (
            social: {
              link: string;
              name?: string;
            },
          ) => {
            const label = social.name
              ? social.name.charAt(0).toUpperCase() +
                social.name.slice(1)
              : "Website";

            return `[${label}](${social.link}?utm=explore_guraidhoo_ai_chat)`;
          },
        );

      if (validSocials.length > 0) {
        cleanObject.formatted_socials =
          validSocials;
      }
    }

    const latitude = Number(
      contact.coordinates?.lat,
    );

    const longitude = Number(
      contact.coordinates?.lng,
    );

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      !(latitude === 0 && longitude === 0)
    ) {
      cleanObject.formatted_map_link =
        `[Show On Map](https://www.google.com/maps/search/?api=1&query=${latitude},${longitude})`;

      cleanObject.formatted_direction_link =
        `[Direction to ${result.title}](https://www.google.com/maps/dir/?api=1` +
        `&destination=${encodeURIComponent(
          `${latitude},${longitude}`,
        )}` +
        `&travelmode=walking` +
        `&dir_action=navigate&basemap=satellite)`;
    }

    cleanObject.metadata =
      result.metadata?.toJSON
        ? result.metadata.toJSON()
        : result.metadata;

    return cleanObject;
  });
}

function buildKnowledgeContext(
  results: any[],
): string {
  if (!results.length) {
    return "No relevant information was found in the knowledge base.";
  }

  const formatValue = (
    value: unknown,
  ): string | null => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    if (
      Array.isArray(value) &&
      value.length === 0
    ) {
      return null;
    }

    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as object).length === 0
    ) {
      return null;
    }

    return typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  };

  return results
    .map((result, index) => {
      const fields = [
        ["Name", result.title],
        ["Description", result.description],
        ["Address", result.address],
        ["Phone", result.formatted_phone],
        ["WhatsApp", result.whatsapp],
        ["Email", result.formatted_email],
        ["Socials", result.formatted_socials],
        ["Map", result.formatted_map_link],
        ["Direction", result.formatted_direction_link],
        ["Metadata", result.metadata],
        ["Images", result.formatted_images],
      ]
        .map(([label, value]) => {
          const formatted =
            formatValue(value);

          return formatted
            ? `${label}: ${formatted}`
            : null;
        })
        .filter(Boolean);

      return `[Knowledge Result ${index + 1}]\n${fields.join("\n")}`;
    })
    .join("\n\n");
}

async function getRAGContext(
  query: string,
): Promise<string> {
  try {
 

    const searchResults =
      await vectorSearch(
        query,
        RAG_LIMIT,
      );



    if (!searchResults.length) {
      return "No relevant information was found in the knowledge base.";
    }

    const rankedResults =
      await jevRetrieve(
        query,
        searchResults,
      );



    const cleanedResults =
      cleanSearchResults(
        rankedResults,
      );

    return buildKnowledgeContext(
      cleanedResults,
    );
  } catch (error) {
    console.error(
      "❌ RAG error:",
      error,
    );

    return "The knowledge base could not be searched. Do not invent information.";
  }
}

/* =========================================================
   OPENAI TOOL
========================================================= */

const OPEN_AI_TOOL = {
  type: "function" as const,

  name: "search_guraidhoo",

  description: `
Search the Explore Guraidhoo knowledge base.

Use this tool when the information required to answer
the user's current question is not already available
in the conversation.

Do NOT call this tool again if previous search results
already contain enough information to answer the question.

Use this tool when:

- the user asks about a new topic;
- previous knowledge does not contain the requested information;
- a required field is missing;
- the user changes topic;
- the requested information needs to be retrieved
  from the Guraidhoo knowledge base.

Never invent Guraidhoo-specific information.
`,

  parameters: {
    type: "object",

    properties: {
      query: {
        type: "string",

        description:
          "The information that needs to be searched in the Guraidhoo knowledge base.",
      },
    },

    required: ["query"],

    additionalProperties: false,
  },

  strict: true,
};
const GEMINI_AI_TOOL = {
      type: "function" as const,
      name: "search_guraidhoo",
      description:
        `
Search the Explore Guraidhoo knowledge base.

Use this tool when the information required to answer
the user's current question is not already available
in the conversation.

Do NOT call this tool again if previous search results
already contain enough information to answer the question.

Use this tool when:

- the user asks about a new topic;
- previous knowledge does not contain the requested information;
- a required field is missing;
- the user changes topic;
- the requested information needs to be retrieved
  from the Guraidhoo knowledge base.

Never invent Guraidhoo-specific information.
`,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The information that needs to be searched in the Guraidhoo knowledge base. translate the dhivehi query to english",
          },
        },
        required: ["query"],
      },
    }

async function executeSearchTool(
  args: unknown,
): Promise<string> {
  if (
    !args ||
    typeof args !== "object"
  ) {
    throw new Error(
      "Invalid search_guraidhoo arguments.",
    );
  }

  const input = args as {
    query?: unknown;
  };

  if (
    typeof input.query !== "string" ||
    !input.query.trim()
  ) {
    throw new Error(
      "search_guraidhoo requires a query.",
    );
  }


  return getRAGContext(
    input.query.trim(),
  );
}

/* =========================================================
   DATE / TIME
========================================================= */

function getMaldivesDateTime() {
  const now = new Date();

  const date = now.toLocaleDateString(
    "en-MV",
    {
      timeZone: "Indian/Maldives",
      dateStyle: "full",
    },
  );

  const time = now.toLocaleTimeString(
    "en-MV",
    {
      timeZone: "Indian/Maldives",
      timeStyle: "short",
    },
  );

  return {
    date,
    time,
  };
}

/* =========================================================
   LOGGING
========================================================= */

async function safeLogConversation(params: {
  sessionId: string;

  model: string;

  userMessage: string;

  assistantResponse: string;

  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };

  responseTimeMs: number;

  status:
    | "completed"
    | "error";

  errorMessage?: string;

  provider:
    | "gemini"
    | "openai";

  routing: RoutingResult;

  conversationId?: string;

  interactionId?: string;

  toolCalls?: number;
}) {
  try {
    await logGeminiRequest({
      sessionId:

        params.sessionId,

      model:
        params.model,

      userMessage:
        params.userMessage,

      assistantResponse:
        params.assistantResponse,

      usage: {
        inputTokens:
          params.usage
            ?.inputTokens ?? 0,

        outputTokens:
          params.usage
            ?.outputTokens ?? 0,

        totalTokens:
          params.usage
            ?.totalTokens ?? 0,
      },

      toolCalls:
        params.toolCalls ?? 0,

      responseTimeMs:
        params.responseTimeMs,

      status:
        params.status,

      errorMessage:
        params.errorMessage,
    });
  } catch (error) {
    console.error(
      "❌ Failed to log AI request:",
      error,
    );
  }
}

/* =========================================================
   OPENAI STREAMING + TOOL LOOP
========================================================= */

async function streamOpenAI(params: {
  message: string;

  systemInstruction: string;

  conversationId?: string;

  onText: (
    text: string,
  ) => void;

  onToolStart?: (
    toolName: string,
    query: string,
  ) => void;

  onToolEnd?: (
    toolName: string,
  ) => void;
}) {
  const existingConversationId =
    params.conversationId?.trim() ||
    undefined;

  const conversationId =
    existingConversationId ??
    (
      await openAI.conversations.create()
    ).id;

  let fullText = "";

  let modelUsed =
    OPENAI_MODEL;

  let toolCallCount = 0;

  let usage:
    | {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
      }
    | undefined;

  /**
   * First request:
   *
   *     user message
   *
   * Subsequent requests:
   *
   *     function_call_output
   */
  let input:
    | string
    | OpenAI.Responses.ResponseInputItem[] =
    params.message;

  for (
    let loop = 0;
    loop < MAX_TOOL_LOOPS;
    loop++
  ) {


    const responseStream =
      await openAI.responses.create({
        model:
          OPENAI_MODEL,

        instructions:
          params.systemInstruction,

        conversation:
          conversationId,

        input,

        reasoning: {
          effort: "low",
        },

        tools: [
          OPEN_AI_TOOL,
        ],

        parallel_tool_calls:
          false,

        stream: true,
      });

    let completedResponse:
      | OpenAI.Responses.Response
      | undefined;

    for await (
      const event of responseStream
    ) {
      /**
       * Normal assistant text.
       */
      if (
        event.type ===
        "response.output_text.delta"
      ) {
        const text =
          event.delta;

        if (text) {
          fullText += text;

          params.onText(text);
        }
      }

      /**
       * Completed response.
       *
       * The actual function_call items
       * are available on response.output.
       */
      if (
        event.type ===
        "response.completed"
      ) {
        completedResponse =
          event.response;

        modelUsed =
          completedResponse.model ||
          OPENAI_MODEL;

        if (
          completedResponse.usage
        ) {
          usage = {
            inputTokens:
              completedResponse
                .usage
                .input_tokens ?? 0,

            outputTokens:
              completedResponse
                .usage
                .output_tokens ?? 0,

            totalTokens:
              completedResponse
                .usage
                .total_tokens ?? 0,
          };
        }
      }
    }

    if (!completedResponse) {
      throw new Error(
        "OpenAI response did not complete.",
      );
    }

    /**
     * Find function calls.
     */
    const toolCalls =
      completedResponse.output.filter(
        (
          item,
        ): item is OpenAI.Responses.ResponseFunctionToolCall =>
          item.type ===
          "function_call",
      );

    /**
     * No function call means the
     * assistant has finished.
     */
    if (
      toolCalls.length === 0
    ) {
      break;
    }



    const toolOutputs: OpenAI.Responses.ResponseInputItem[] =
      [];

    /**
     * Execute every function call.
     */
    for (
      const toolCall of toolCalls
    ) {
      if (
        toolCall.name !==
        OPEN_AI_TOOL.name
      ) {
        throw new Error(
          `Unknown tool: ${toolCall.name}`,
        );
      }

      toolCallCount++;

      let args: {
        query: string;
      };

      try {
        args = JSON.parse(
          toolCall.arguments,
        ) as {
          query: string;
        };
      } catch {
        throw new Error(
          `Invalid arguments from search_guraidhoo: ${toolCall.arguments}`,
        );
      }

      if (
        typeof args.query !==
          "string" ||
        !args.query.trim()
      ) {
        throw new Error(
          "search_guraidhoo returned an empty query.",
        );
      }


      /**
       * Tell frontend that search
       * has started.
       */
      params.onToolStart?.(
        toolCall.name,
        args.query,
      );

      let result: string;

      try {
        result =
          await executeSearchTool(
            args,
          );
      } catch (error) {
        console.error(
          "❌ search_guraidhoo failed:",
          error,
        );

        result =
          "The knowledge base search failed. Do not invent information.";
      }

      /**
       * Tell frontend search finished.
       */
      params.onToolEnd?.(
        toolCall.name,
      );

      /**
       * IMPORTANT:
       *
       * This MUST be toolCall.call_id.
       *
       * Do NOT use toolCall.id.
       */
      toolOutputs.push({
        type:
          "function_call_output",

        call_id:
          toolCall.call_id,

        output:
          result,
      });
    }

    /**
     * Send tool results back to OpenAI.
     */
    input =
      toolOutputs;
  }

  return {
    fullText,

    usage,

    conversationId,

    model:
      modelUsed,

    toolCalls:
      toolCallCount,
  };
}

/* =========================================================
   GEMINI STREAMING
========================================================= */


async function streamGemini(params: {
  message: string;
  systemInstruction: string;
  interactionId?: string;
  onText: (text: string) => void;
  onToolStart?: (
    toolName: string,
    query: string,
  ) => void;
  onToolEnd?: (
    toolName: string,
  ) => void;
}) {


  let fullText = "";

  let modelUsed = GEMINI_MODEL;

  let currentInteractionId =
    params.interactionId;

  let toolCallCount = 0;

  let usage:
    | {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
      }
    | undefined;

  /**
   * A Gemini interaction can request one or more
   * function calls during a turn.
   */
  type GeminiFunctionCall = {
    id: string;
    name: string;
    arguments: string;
  };

  /**
   * Consume one Gemini streaming response.
   *
   * Returns any function calls requested by Gemini.
   */
  async function consumeStream(
    stream: AsyncIterable<any>,
  ): Promise<GeminiFunctionCall[]> {
    const functionCalls = new Map<
      string,
      GeminiFunctionCall
    >();

    for await (const event of stream) {
      /**
       * -----------------------------------------------------
       * Interaction created
       * -----------------------------------------------------
       */
      if (
        event.event_type ===
        "interaction.created"
      ) {
        currentInteractionId =
          event.interaction?.id ??
          currentInteractionId;
      }

      /**
       * -----------------------------------------------------
       * Function call started
       * -----------------------------------------------------
       */
      if (
        event.event_type ===
        "step.start"
      ) {
        const step = event.step;

        if (
          step?.type ===
          "function_call"
        ) {
          functionCalls.set(
            step.id,
            {
              id: step.id,
              name: step.name,
              arguments: "",
            },
          );
        }
      }

      /**
       * -----------------------------------------------------
       * Normal text streaming
       * -----------------------------------------------------
       */
      if (
        event.event_type ===
          "step.delta" &&
        event.delta?.type === "text"
      ) {
        const text =
          event.delta.text ?? "";

        if (text) {
          fullText += text;

          params.onText(text);
        }
      }

      /**
       * -----------------------------------------------------
       * Function arguments streaming
       * -----------------------------------------------------
       *
       * Gemini sends the JSON arguments in pieces.
       */
      if (
        event.event_type ===
          "step.delta" &&
        event.delta?.type ===
          "arguments_delta"
      ) {
        const functionCall =
          event.delta?.id
            ? functionCalls.get(
                event.delta.id,
              )
            : [...functionCalls.values()][
                functionCalls.size - 1
              ];

        if (functionCall) {
          functionCall.arguments +=
            event.delta.arguments ?? "";
        }
      }

      /**
       * -----------------------------------------------------
       * Interaction completed
       * -----------------------------------------------------
       */
      if (
        event.event_type ===
        "interaction.completed"
      ) {
        const interaction =
          event.interaction;

        modelUsed =
          interaction?.model ??
          GEMINI_MODEL;

        currentInteractionId =
          interaction?.id ??
          currentInteractionId;

        if (interaction?.usage) {
          usage = {
            inputTokens:
              interaction.usage
                .total_input_tokens ??
              0,

            outputTokens:
              interaction.usage
                .total_output_tokens ??
              0,

            totalTokens:
              interaction.usage
                .total_tokens ??
              0,
          };
        }
      }
    }

    return [...functionCalls.values()];
  }

  /**
   * =========================================================
   * TOOL LOOP
   * =========================================================
   */
  let input:
    | string
    | any[] =
    params.message;

  for (
    let loop = 0;
    loop < MAX_TOOL_LOOPS;
    loop++
  ) {


    /**
     * -------------------------------------------------------
     * Create Gemini interaction
     * -------------------------------------------------------
     */
    const stream =
      await googleAI.interactions.create({
        model: GEMINI_MODEL,

system_instruction: `${params.systemInstruction} translate everything to dhivehi, if user speak in dhivehi latin response in latin, if user speak in dhivehi thaana response in thaana`,

        input,

        ...(currentInteractionId
          ? {
              previous_interaction_id:
                currentInteractionId,
            }
          : {}),

        generation_config: {
          thinking_level: "low",
        },

        tools: [GEMINI_AI_TOOL],

        stream: true,
      });

    /**
     * Consume Gemini stream.
     */
    const functionCalls =
      await consumeStream(
        stream,
      );

    /**
     * -------------------------------------------------------
     * No tool call = Gemini finished
     * -------------------------------------------------------
     */
    if (
      functionCalls.length === 0
    ) {
      break;
    }

  
    /**
     * -------------------------------------------------------
     * Execute requested tools
     * -------------------------------------------------------
     */
    const functionResults: any[] = [];

    for (
      const functionCall of functionCalls
    ) {
      if (
        functionCall.name !==
        "search_guraidhoo"
      ) {
        throw new Error(
          `Unknown function: ${functionCall.name}`,
        );
      }

      toolCallCount++;

      let args: {
        query: string;
      };

      try {
        args = JSON.parse(
          functionCall.arguments ||
            "{}",
        ) as {
          query: string;
        };
      } catch {
        throw new Error(
          `Invalid arguments from search_guraidhoo: ${functionCall.arguments}`,
        );
      }

      if (
        typeof args.query !==
          "string" ||
        !args.query.trim()
      ) {
        throw new Error(
          "search_guraidhoo returned an empty query.",
        );
      }

      const query =
        args.query.trim();

      /**
       * Tell frontend that the tool started.
       */
      params.onToolStart?.(
        functionCall.name,
        query,
      );

      let result: string;

      try {
        result =
          await executeSearchTool({
            query,
          });
      } catch (error) {
        console.error(
          "❌ Gemini search_guraidhoo failed:",
          error,
        );

        result =
          "The knowledge base search failed. Do not invent information.";
      }

      /**
       * Tell frontend that the tool finished.
       */
      params.onToolEnd?.(
        functionCall.name,
      );

      /**
       * Gemini function result.
       */
      functionResults.push({
        type: "function_result",

        name:
          functionCall.name,

        call_id:
          functionCall.id,

        result: [
          {
            type: "text",
            text: result,
          },
        ],
      });
    }

    /**
     * -------------------------------------------------------
     * Send tool results back to Gemini
     * -------------------------------------------------------
     *
     * The next interaction continues from
     * currentInteractionId.
     */
    input = functionResults;
  }

  /**
   * ---------------------------------------------------------
   * Safety check
   * ---------------------------------------------------------
   */
  if (!currentInteractionId) {
    throw new Error(
      "Gemini response did not produce an interaction ID.",
    );
  }

  return {
    fullText,

    usage,

    interactionId:
      currentInteractionId,

    model:
      modelUsed,

    toolCalls:
      toolCallCount,
  };
}


/* =========================================================
   POST
========================================================= */

export async function POST(
  req: NextRequest,
) {


  const startTime =
    Date.now();

  const sessionId =
    req.cookies.get(
      "session_id",
    )?.value ?? "";

  /* -------------------------------------------------------
     CORS
  ------------------------------------------------------- */

  const requestOrigin =
    req.headers.get(
      "origin",
    );

  const allowedOrigins =
    (
      process.env.ALLOWED_ORIGINS ??
      ""
    )
      .split(",")
      .map(
        (origin) =>
          origin.trim(),
      )
      .filter(Boolean);

  if (
    requestOrigin &&
    allowedOrigins.length > 0 &&
    !allowedOrigins.includes(
      requestOrigin,
    )
  ) {
    return new Response(
      "Forbidden",
      {
        status: 403,
      },
    );
  }

  /* -------------------------------------------------------
     Body
  ------------------------------------------------------- */

  let body: {
    message?: string;

    conversationId?: string;

    interactionId?: string;

    intent?: {
      intent: Intent;

      dateTime:
        DateTimeRequirement;

      lang: Language;
    } | null;
  };

  try {
    body =
      await req.json();
  } catch {
    return new Response(
      "Invalid JSON",
      {
        status: 400,
      },
    );
  }

  const message =
    body.message?.trim();

  if (!message) {
    return new Response(
      "Message is required",
      {
        status: 400,
      },
    );
  }

  /* -------------------------------------------------------
     NDJSON
  ------------------------------------------------------- */

  const encoder =
    new TextEncoder();

  const sendNDJSON = (
    controller:
      ReadableStreamDefaultController,
    data: Record<
      string,
      any
    >,
  ) => {
    controller.enqueue(
      encoder.encode(
        JSON.stringify(data) +
          "\n",
      ),
    );
  };

  /* -------------------------------------------------------
     Stream
  ------------------------------------------------------- */

  const stream =
    new ReadableStream({
      async start(
        controller,
      ) {
        let fullResponseText =
          "";

        let activeRouting:
          RoutingResult = {
          intent:
            "knowledge",

          dateTime:
            "not_required",

          lang:
            "major",
        };

        let provider:
          | "gemini"
          | "openai" =
          "openai";

        let toolCallCount =
          0;

        try {
          /* -----------------------------------------------
             Jev routing

             Client can send routing so we don't
             call Jev again.
          ------------------------------------------------ */

          const routing =
            !body.intent
              ? await routeWithJev(
                  message,
                )
              : body.intent;

          activeRouting =
            routing;


          /* -----------------------------------------------
             Date / time
          ------------------------------------------------ */

          let dateTimeContext =
            "";

          if (
            routing.dateTime ===
            "required"
          ) {
            const {
              date,
              time,
            } =
              getMaldivesDateTime();

            dateTimeContext = `
CURRENT MALDIVES DATE AND TIME

Date: ${date}
Time: ${time}
`;
          }

          /* -----------------------------------------------
             IMPORTANT

             DO NOT call getRAGContext() here.

             The OpenAI model will call
             search_guraidhoo only when it
             needs knowledge.
          ------------------------------------------------ */

         // Combine system prompt with date context
const baseSystemPrompt =
  routing.intent === "casual" && routing.lang !== "dhivehi"
    ? CASUAL_SYSTEM_PROMPT
    : SYSTEM_PROMPT;

const systemInstruction = `
${baseSystemPrompt}

${dateTimeContext}
`.trim();

          /* -----------------------------------------------
             Provider
          ------------------------------------------------ */

          provider =
            routing.lang ===
            "dhivehi"
              ? "gemini"
              : "openai";

          /* ===============================================
             GEMINI
          =============================================== */

         if (provider === "gemini") {


  let firstTokenReceived = false;

  const result = await streamGemini({
    message,

    systemInstruction,

    interactionId:
      body.interactionId,

    onText(delta) {
      if (!firstTokenReceived) {
        firstTokenReceived = true;


      }

      fullResponseText += delta;

      sendNDJSON(
        controller,
        {
          type: "text",
          delta,
        },
      );
    },

    onToolStart(
      toolName,
      query,
    ) {




      sendNDJSON(
        controller,
        {
          type: "tool_start",
          tool: toolName,
          query,
        },
      );
    },

    onToolEnd(toolName) {




      sendNDJSON(
        controller,
        {
          type: "tool_end",
          tool: toolName,
        },
      );
    },
  });



  toolCallCount =
    result.toolCalls;

  sendNDJSON(
    controller,
    {
      type: "done",

      interactionId:
        result.interactionId,

      model:
        result.model,

      provider:
        "gemini",

      toolCalls:
        result.toolCalls,
    },
  );

  await safeLogConversation({
    sessionId,

    model:
      result.model,

    userMessage:
      message,

    assistantResponse:
      fullResponseText,

    usage:
      result.usage,

    responseTimeMs:
      Date.now() -
      startTime,

    status:
      "completed",

    provider:
      "gemini",

    routing,

    interactionId:
      result.interactionId,

    toolCalls:
      result.toolCalls,
  });
}

          /* ===============================================
             OPENAI
          =============================================== */

          else {
            const result =
              await streamOpenAI({
                message,

                systemInstruction,

                conversationId:
                  body.conversationId,

                onText(delta) {
                  fullResponseText +=
                    delta;

                  sendNDJSON(
                    controller,
                    {
                      type:
                        "text",

                      delta,
                    },
                  );
                },

                onToolStart(
                  toolName,
                  query,
                ) {


                  sendNDJSON(
                    controller,
                    {
                      type:
                        "tool_start",

                      tool:
                        toolName,

                      query,
                    },
                  );
                },

                onToolEnd(
                  toolName,
                ) {


                  sendNDJSON(
                    controller,
                    {
                      type:
                        "tool_end",

                      tool:
                        toolName,
                    },
                  );
                },
              });

              toolCallCount =
              result.toolCalls;

              sendNDJSON(
                controller,
                {
                  type:
                    "done",

                  conversationId:
                    result.conversationId,

                  model:
                    result.model,

                  provider:
                    "openai",

                  toolCalls:
                    result.toolCalls,
                },
              );

            await safeLogConversation({
              sessionId,

              model:
                result.model,

              userMessage:
                message,

              assistantResponse:
                fullResponseText,

              usage:
                result.usage,

              responseTimeMs:
                Date.now() -
                startTime,

              status:
                "completed",

              provider:
                "openai",

              routing,

              conversationId:
                result.conversationId,

              toolCalls:
                result.toolCalls,
            });
          }

          /* -----------------------------------------------
             Close stream
          ------------------------------------------------ */

          controller.close();
        } catch (error) {
          console.error(
            "❌ Streaming Error:",
            error,
          );

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Unknown error";

          sendNDJSON(
            controller,
            {
              type:
                "error",

              message:
                errorMessage,
            },
          );

          await safeLogConversation({
            sessionId,

            model:
              provider ===
              "gemini"
                ? GEMINI_MODEL
                : OPENAI_MODEL,

            userMessage:
              message,

            assistantResponse:
              fullResponseText,

            responseTimeMs:
              Date.now() -
              startTime,

            status:
              "error",

            errorMessage,

            provider,

            routing:
              activeRouting,

            toolCalls:
              toolCallCount,
          });

          /**
           * Close normally after sending
           * our NDJSON error.
           *
           * This is preferable to controller.error()
           * because the client can still receive
           * the error event.
           */
          controller.close();
        }
      },
    });

  return new Response(
    stream,
    {
      status: 200,

      headers: {
        "Content-Type":
          "application/x-ndjson; charset=utf-8",

        "Cache-Control":
          "no-cache, no-transform",

        Connection:
          "keep-alive",

        "X-Accel-Buffering":
          "no",
      },
    },
  );
}