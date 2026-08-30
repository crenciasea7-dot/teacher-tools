import { redirect } from "next/navigation";
import Link from "next/link";
import { hasAdminSession } from "../../lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) redirect("/signin-with-chatgpt");
  const aiConnected = Boolean(process.env.AI_GATEWAY_API_KEY);
  return <main className="section-page"><header className="section-hero"><span>ADMIN CONTROL CENTER · V1</span><h1>관리자 페이지</h1><p>운영자 전용 설정과 연결 상태를 확인합니다.</p></header><section className="tool-intro centered"><p className="copy-toast">관리자로 로그인됨</p><h2>AI 연결 상태</h2><p>{aiConnected ? "등록됨 · AI Gateway가 연결되어 있습니다." : "미등록 · AI_GATEWAY_API_KEY를 Vercel Production에 등록해 주세요."}</p><div className="admin-actions"><Link href="/research-insights" className="os-action">자료 정리로 이동</Link><form action="/api/admin-logout" method="post"><button type="submit" className="os-action">로그아웃</button></form></div></section></main>;
}
