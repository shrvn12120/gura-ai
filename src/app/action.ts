"use server";

import { Conversation } from "@/components/admin/conversations-table";
import { MetaConfig } from "@/components/admin/meta-config/types";
import { db } from "@/lib/db";
import { openai } from "@/lib/openai";

// --------------------- //

type RetrievalType =
  | "general"
  | "knowledge"
  | "single"
  | "category"
  | "semantic";

export type IntentClassification = {
  type: RetrievalType;
  name: string | null;
  category: string | null;
  subCategory: string | null;
};

// 
// --------------------------------------------- //

export async function getMetaConfigs(): Promise<MetaConfig[]> {
    const res = await db.query(
    `
    SELECT *
    FROM meta_configs
      
    `
  );

  if (res.rows.length === 0) {
    return [];
  }

  return res.rows
}

export async function CATEGORY_META_CONFIGS() {
  "use cache";

  const items = await getMetaConfigs();
  const structuredTree: Record<string, Record<string, any>> = {};

  if (!items) return structuredTree;

  items.forEach((doc) => {
    const item = doc;
    const category = item.category;

    // 1. If the top-level category doesn't exist yet, create it dynamically
    if (!structuredTree[category]) {
      structuredTree[category] = {};
    }

    // 2. Safely check if subCategories array exists on this document record
    if (Array.isArray(item.sub_categories)) {
      item.sub_categories.forEach((subCat: any) => {
        // Use the subcategory's name as the key (e.g., "restaurant")
        const subCategoryKey = subCat.name || "default";

        // Map the fields array directly underneath that key matching the target layout structure
        structuredTree[category][subCategoryKey] = subCat.fields || [];
      });
    }
  });

  return structuredTree;
}

export async function getMetaConfigById(id: string) {
  const result = await db.query(
    `
    SELECT
      id,
      category,
      sub_categories,
      created_at,
      updated_at

    FROM meta_configs

    WHERE id = $1

    LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
export async function getListingsById(id: string) {
  const result = await db.query(
    `
    SELECT *

    FROM listings

    WHERE id = $1

    LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}
export async function getActiveNotices() {
  const result = await db.query(
    `
    SELECT
      id,
      title,
      message,
      type,
      priority,
      is_active,
      created_at

    FROM notices

    WHERE is_active=true

    ORDER BY created_at DESC
    `,
  );

  return result.rows;
}
export async function getAllNotices() {
  const result = await db.query(
    `
    SELECT
      id,
      title,
      message,
      type,
      priority,
      is_active,
      created_at

    FROM notices

    ORDER BY created_at DESC
    `,
  );

  return result.rows;
}
export async function getNoticeById(id: string) {
  const result = await db.query(
    `
    SELECT *

    FROM notices

    WHERE id = $1

    LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function getConversationHistory(conId: string) {
  // Add &limit=100 to fetch more than the default 20 items
  const conversation = await fetch(
    `https://api.openai.com/v1/conversations/${conId}/items?limit=100&include[]=message.input_image.image_url&include[]=computer_call_output.output.image_url&include[]=file_search_call.results&order=desc`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "openai-project": "proj_8ewh1krDbm88VZ6yAcO1JlIx",
      },
    }
  );

  const data = await conversation.json();

  if (!data.data) {
    return JSON.stringify([]);
  }

  const history = data.data
    .filter((item: any) => item.type === "message" && item.role !== "developer")
    .map((item: any) => {
      // Safely extract text content regardless of content array structure
      let text = "";
      if (typeof item.content === "string") {
        text = item.content;
      } else if (Array.isArray(item.content)) {
        text = item.content.find((c: any) => c.type === "text")?.text ?? item.content?.[0]?.text ?? "";
      }

      return {
        role: item.role,
        content: text,
      };
    })
    .filter((item: any) => item.content.trim() !== "") // Remove empty artifacts
    .reverse(); // Put back into chronological order

  return JSON.stringify(history);
}
 export  async function getAllConversationHistory() {
const conversation = await fetch(`https://api.openai.com/v1/dashboard/conversations`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer sess-RsrYTtcv22eBcAacqPv6jDfQ0xIPhMzf8WILWAh5`,
    "Content-Type": "application/json",
    "openai-project": "proj_8ewh1krDbm88VZ6yAcO1JlIx",
  },
});

// const result = await db.query(
//     `
//     SELECT *

//     FROM conversations
//     `
//   );

//   if (result.rows.length === 0) {
//     return null;
//   }

//   return result.rows as Conversation[];

const {data} = await conversation.json()



return data as Conversation[];

}


export async function syncConversation(conId: string) {
  if (!conId) {
    throw new Error("Conversation ID is required");
  }

  // Get conversation from OpenAI
  const response = await fetch(
    `https://api.openai.com/v1/conversations/${conId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `OpenAI conversation sync failed: ${response.status} ${error}`
    );
  }


  type OpenAIConversation = {
  id: string;
  object: string;
  created_at: number;
  first_item: {
    id: string;
    type: string;
    status: "completed" | "in_progress" | "failed" | string;
    content: Array<{
      type: string;
      text: string;
    }>;
    role: string;
  };
  num_responses: number;
  num_tokens: number;
  metadata: Record<string, unknown>;
};

  const conversation: OpenAIConversation = await response.json();

  // Update existing conversation record
  const result = await db.query(
    `
    UPDATE conversations
    SET
      object = $1,
      openai_created_at = $2,
      first_item = $3,
      num_responses = $4,
      num_tokens = $5,
      metadata = $6,
      synced_at = NOW(),
      updated_at = NOW()
    WHERE openai_conversation_id = $7
    RETURNING *;
    `,
    [
      conversation.object,
      conversation.created_at,
      conversation.first_item
        ? JSON.stringify(conversation.first_item)
        : null,
      conversation.num_responses,
      conversation.num_tokens,
      JSON.stringify(conversation.metadata ?? {}),
      conversation.id,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error(
      `Conversation ${conId} does not exist in PostgreSQL`
    );
  }

  return result.rows[0];
}