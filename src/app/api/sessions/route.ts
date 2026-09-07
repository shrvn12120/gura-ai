import { NextResponse } from "next/server";
import { db } from "@/lib/db";



export async function GET() {
  try {
    const { rows } = await db.query(`
      SELECT
          session_id,
          COUNT(*)::INTEGER AS request_count,
          COALESCE(SUM(input_tokens), 0)::BIGINT AS input_tokens,
          COALESCE(SUM(output_tokens), 0)::BIGINT AS output_tokens,
          COALESCE(SUM(total_tokens), 0)::BIGINT AS total_tokens,
          COALESCE(SUM(tool_calls), 0)::INTEGER AS tool_calls,
          COUNT(*) FILTER (WHERE status = 'error')::INTEGER AS error_count,
          MIN(created_at) AS started_at,
          MAX(created_at) AS last_activity,

          (
            ARRAY_AGG(
              user_message
              ORDER BY created_at ASC
            ) FILTER (
              WHERE user_message IS NOT NULL
              AND user_message <> ''
            )
          )[1] AS first_user_message

      FROM conversations

      GROUP BY session_id

      ORDER BY MAX(created_at) DESC
    `);

    return NextResponse.json({
      success: true,
      sessions: rows,
    });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sessions",
      },
      {
        status: 500,
      }
    );
  }
}