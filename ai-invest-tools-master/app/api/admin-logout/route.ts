import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).delete("admin_session");
  return Response.redirect(new URL("/signin-with-chatgpt", process.env.NEXT_PUBLIC_SITE_URL || "https://ai-invest-tools.vercel.app"));
}
