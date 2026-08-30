import { cookies } from "next/headers";
import { signAdminSession } from "../../../lib/admin-auth";

const attempts = new Map<string, { count: number; resetAt: number }>();
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now(); const current = attempts.get(ip);
  if (current && current.resetAt > now && current.count >= 5) return Response.json({ error: "잠시 후 다시 시도해 주세요." }, { status: 429 });
  const { password } = await request.json() as { password?: string };
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) return Response.json({ error: "관리자 환경변수가 아직 설정되지 않았습니다." }, { status: 503 });
  if (!password || password !== process.env.ADMIN_PASSWORD) { attempts.set(ip, { count: (current?.resetAt > now ? current.count : 0) + 1, resetAt: current?.resetAt > now ? current.resetAt : now + 15 * 60 * 1000 }); return Response.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 }); }
  attempts.delete(ip);
  (await cookies()).set("admin_session", signAdminSession(), { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return Response.json({ ok: true });
}
