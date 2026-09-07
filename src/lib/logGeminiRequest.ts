import { MODEL, UsageStats } from "@/app/api/chat/route";
import { db } from "./db";

export async function logGeminiRequest({
  sessionId,
  userMessage,
  assistantResponse,
  usage,
  toolCalls,
  responseTimeMs,
  status,
  errorMessage,
}: {
  sessionId: string;
  userMessage: string;
  assistantResponse: string;
  usage: UsageStats;
  toolCalls: number;
  responseTimeMs: number;
  status: "completed" | "error";
  errorMessage?: string | null;
}) {
  
  try {
    await db.query(
      `
      INSERT INTO conversations (
        session_id,
        model,
        user_message,
        assistant_response,
        input_tokens,
        output_tokens,
        total_tokens,
        tool_calls,
        response_time_ms,
        status,
        error_message
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11
      )
      `,
      [
        sessionId,
        MODEL,
        userMessage,
        assistantResponse || null,
        usage.inputTokens,
        usage.outputTokens,
        usage.totalTokens,
        toolCalls,
        responseTimeMs,
        status,
        errorMessage || null,
      ]
    );
  } catch (error) {
    console.error(
      "❌ Failed to log Gemini request:",
      error
    );
  }
}