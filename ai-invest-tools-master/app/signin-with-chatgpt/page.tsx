"use client";
import Link from "next/link";
import { useState } from "react";

export default function AdminSignInPage() {
  const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
    async function login(event: React.FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); try { const response = await fetch("/api/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); window.location.href = "/admin"; } catch (error) { setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다."); } finally { setBusy(false); } }
  return <main className="section-page"><header className="section-hero"><span>ADMIN AI CONNECTION · V1</span><h1>관리자 로그인</h1><p>운영자 전용 AI 연결 설정</p></header><section className="tool-intro centered"><h2>관리자 비밀번호</h2><form onSubmit={login}><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호 입력" autoComplete="current-password" required /><button type="submit" className="os-action" disabled={busy}>{busy ? "확인 중…" : "로그인"}</button></form>{message && <p className="copy-toast">{message}</p>}<Link href="/" className="os-action">홈으로 돌아가기</Link></section></main>;
}
