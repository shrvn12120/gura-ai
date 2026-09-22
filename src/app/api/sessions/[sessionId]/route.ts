import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {

  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required",
        },
        {
          status: 400,
        }
      );
    }

    const { rows } = await db.query(
      `
      SELECT
          id,
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
          error_message,
          created_at

      FROM conversations

      WHERE session_id = $1

      ORDER BY created_at ASC
      `,
      [sessionId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Session not found",
        },
        {
          status: 404,
        }
      );
    }

    // Session-level statistics
    const stats = rows.reduce(
      (acc, row) => {
        acc.input_tokens += Number(row.input_tokens || 0);
        acc.output_tokens += Number(row.output_tokens || 0);
        acc.total_tokens += Number(row.total_tokens || 0);
        acc.tool_calls += Number(row.tool_calls || 0);

        if (row.status === "error") {
          acc.errors += 1;
        }

        if (row.response_time_ms) {
          acc.response_time_ms += Number(row.response_time_ms);
        }

        return acc;
      },
      {
        input_tokens: 0,
        output_tokens: 0,
        total_tokens: 0,
        tool_calls: 0,
        errors: 0,
        response_time_ms: 0,
      }
    );

    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionId,
        request_count: rows.length,
        started_at: rows[0].created_at,
        last_activity: rows[rows.length - 1].created_at,
        ...stats,
      },
      requests: rows,
    });
  } catch (error) {
    console.error("Failed to fetch session:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch session",
      },
      {
        status: 500,
      }
    );
  }
}