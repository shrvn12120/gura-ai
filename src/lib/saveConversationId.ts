import { db } from "./db";


export async function saveConversationId(
  conversationId: string
) {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const result = await db.query(
    `
    INSERT INTO conversations (
      openai_conversation_id
    )
    VALUES ($1)
    ON CONFLICT (openai_conversation_id)
    DO NOTHING
    RETURNING *;
    `,
    [conversationId]
  );

  return result.rows[0] ?? null;
}