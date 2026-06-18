import { getUserId } from "./get-user";

export function requireAdmin() {
  const userId = getUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}