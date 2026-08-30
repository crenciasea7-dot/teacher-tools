import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export function signAdminSession() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET가 설정되지 않았습니다.");
  return `authenticated.${createHmac("sha256", secret).update("authenticated").digest("hex")}`;
}

export async function hasAdminSession() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get("admin_session")?.value;
  if (!secret || !token) return false;
  const expected = signAdminSession();
  return token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
