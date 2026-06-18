// src/lib/get-user.ts
import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export async function  getUserId() {
  const storeCookies =  await cookies()
    const token = await storeCookies.get('token')?.value
  
  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    return decoded.userId;
  } catch {
    return null;
  }
}