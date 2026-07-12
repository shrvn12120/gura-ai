import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SECRET = process.env.JWT_SECRET!;
const ANSWER =  process.env.ADMIN_AUTH_PASS

export async function POST(req: Request) {
  const { answer } = await req.json();

  if (answer !== ANSWER) {
    return NextResponse.json(
      { message: "You are lying." },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    {
      admin: true,
    },
    SECRET,
    {
      expiresIn: "7d",
    }
  );

  const cookieStore = await cookies();

  cookieStore.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ success: true });
}