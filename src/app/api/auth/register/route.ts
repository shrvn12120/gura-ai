// src/app/api/auth/register/route.ts
import  connectDB  from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/user.model";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectDB();

  const { name, email, password } = await req.json();

  const exists = await User.findOne({ email });
  if (exists) {
    return NextResponse.json({ error: "User exists" }, { status: 400 });
  }

  const hashed = await hashPassword(password);

  await User.create({
    name,
    email,
    password: hashed,
  });

  return NextResponse.json({ success: true });
}