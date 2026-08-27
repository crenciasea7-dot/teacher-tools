"use client";

import Link from "next/link";
import { useState } from "react";

const assistantQuestions = [
  { label: "지금 시장은?", href: "/investment-flow#market" },
  { label: "사야 할까?", href: "/investment-flow#buy" },
  { label: "팔아야 할까?", href: "/investment-flow#sell" },
  { label: "뭘 사야 할까?", href: "/investment-flow#choose" },
];

export default function FloatingActions() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState("");

  async function copy(value: string, message: string) {
    await navigator.clipboard.writeText(value);
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function shareToMobile() {
    const payload = { title: document.title, text: document.title, url: window.location.href };
    if (navigator.share) await navigator.share(payload);
    else await copy(window.location.href, "링크를 복사했습니다. 카카오톡에 붙여 넣으세요.");
  }

  async function saveToNotion() {
    await copy(`${document.title}\n${window.location.href}`, "내용을 복사했습니다. Notion에 붙여 넣으세요.");
    window.open("https://www.notion.so/", "_blank", "noopener,noreferrer");
  }

  function shareByEmail() {
    const subject = encodeURIComponent(document.title);
    const body = encodeURIComponent(`${document.title}\n${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="floating-actions">
      {notice && <div className="floating-notice">{notice}</div>}
      {assistantOpen && <aside className="assistant-panel">
        <div><span>V1 GUIDE</span><button type="button" onClick={() => setAssistantOpen(false)}>×</button></div>
        <h2>지금 무엇을 판단하고 있나요?</h2>
        <p>질문을 고르면 필요한 도구를 순서대로 안내합니다.</p>
        <div>{assistantQuestions.map((question) => <Link href={question.href} onClick={() => setAssistantOpen(false)} key={question.href}>{question.label}<b>→</b></Link>)}</div>
        <small>생성형 AI 연결 전에도 V1 자동 가이드는 작동합니다.</small>
      </aside>}
      {shareOpen && <aside className="share-panel">
        <div><span>SHARE</span><button type="button" onClick={() => setShareOpen(false)}>×</button></div>
        <button type="button" onClick={shareToMobile}>📱 나챗·카카오톡 보내기</button>
        <button type="button" onClick={saveToNotion}>📔 Notion으로 저장</button>
        <button type="button" onClick={shareByEmail}>📧 이메일 전송</button>
        <button type="button" onClick={() => copy(window.location.href, "링크를 복사했습니다.")}>🔗 링크 복사</button>
        <button type="button" onClick={() => copy(`${document.title}\n${window.location.href}`, "페이지 정보를 복사했습니다.")}>📋 내용 복사</button>
      </aside>}
      <div className="floating-buttons">
        <button type="button" className={shareOpen ? "active" : ""} onClick={() => { setShareOpen((open) => !open); setAssistantOpen(false); }} aria-label="공유 메뉴 열기">↗</button>
        <button type="button" className={`assistant-trigger ${assistantOpen ? "active" : ""}`} onClick={() => { setAssistantOpen((open) => !open); setShareOpen(false); }}>🤖 <span>AI 가이드</span></button>
      </div>
    </div>
  );
}
