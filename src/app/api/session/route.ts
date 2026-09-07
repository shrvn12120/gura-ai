import { randomUUID } from "crypto";
import { NextResponse } from "next/server";


const SESSION_COOKIE = "session_id";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function GET(req: Request) {
  try {
    const url = req.url;
    const { searchParams } = new URL(url);
    const reset = searchParams.get("reset") === "true";


    const cookieHeader = req.headers.get("cookie") || "";

    const match = cookieHeader.match(
      /(?:^|;\s*)session_id=([^;]+)/
    );

    const existingSessionId = match?.[1];

    if (existingSessionId && !reset) {
      return NextResponse.json({
        sessionId: existingSessionId,
      });
    }
    

    const sessionId = randomUUID();

    const response = NextResponse.json({
      sessionId,
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Failed to create session:", error);

    return NextResponse.json(
      {
        error: "Unable to create session.",
      },
      {
        status: 500,
      }
    );
  }
}