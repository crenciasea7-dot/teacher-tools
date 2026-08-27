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
  const [downloadOpen, setDownloadOpen] = useState(false);
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

  function pageText() {
    return (document.querySelector("main")?.textContent ?? document.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  function downloadBlob(content: BlobPart, type: string, extension: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${document.title.replace(/[\\/:*?"<>|]/g, "-")}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("내 기기에 저장했습니다.");
    window.setTimeout(() => setNotice(""), 1800);
  }

  function downloadText() {
    downloadBlob(`${document.title}\n${window.location.href}\n\n${pageText()}`, "text/plain;charset=utf-8", "txt");
  }

  function downloadCsv() {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = `항목,내용\n${escape("제목")},${escape(document.title)}\n${escape("링크")},${escape(window.location.href)}\n${escape("저장 시각")},${escape(new Date().toLocaleString("ko-KR"))}\n${escape("페이지 내용")},${escape(pageText())}`;
    downloadBlob(`\uFEFF${csv}`, "text/csv;charset=utf-8", "csv");
  }

  function downloadImage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#f4f8f5";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#146957";
    context.fillRect(0, 0, 22, canvas.height);
    context.fillStyle = "#132723";
    context.font = "700 54px Arial, sans-serif";
    context.fillText(document.title.slice(0, 34), 72, 105);
    context.fillStyle = "#e66f42";
    context.font = "700 22px Arial, sans-serif";
    context.fillText("AI 투자 A to Z · v1.0", 74, 150);
    context.fillStyle = "#536761";
    context.font = "28px Arial, sans-serif";
    const words = pageText().slice(0, 520).split(" ");
    let line = "";
    let y = 220;
    for (const word of words) {
      const candidate = `${line}${word} `;
      if (context.measureText(candidate).width > 1040) { context.fillText(line, 74, y); line = `${word} `; y += 45; }
      else line = candidate;
      if (y > 520) break;
    }
    context.fillText(line, 74, y);
    context.fillStyle = "#7b8b86";
    context.font = "20px Arial, sans-serif";
    context.fillText(window.location.href.slice(0, 92), 74, 590);
    canvas.toBlob((blob) => { if (blob) downloadBlob(blob, "image/png", "png"); }, "image/png");
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
      {downloadOpen && <aside className="share-panel download-panel">
        <div><span>DOWNLOAD · LOCAL ONLY</span><button type="button" onClick={() => setDownloadOpen(false)}>×</button></div>
        <button type="button" onClick={downloadImage}>🖼 요약 이미지 PNG</button>
        <button type="button" onClick={() => window.print()}>📄 PDF로 인쇄·저장</button>
        <button type="button" onClick={downloadCsv}>📊 Excel용 CSV</button>
        <button type="button" onClick={downloadText}>📝 텍스트 파일</button>
        <small>파일은 서버가 아닌 현재 기기에 직접 저장됩니다.</small>
      </aside>}
      <div className="floating-buttons">
        <button type="button" className={downloadOpen ? "active" : ""} onClick={() => { setDownloadOpen((open) => !open); setShareOpen(false); setAssistantOpen(false); }} aria-label="다운로드 메뉴 열기">↓</button>
        <button type="button" className={shareOpen ? "active" : ""} onClick={() => { setShareOpen((open) => !open); setDownloadOpen(false); setAssistantOpen(false); }} aria-label="공유 메뉴 열기">↗</button>
        <button type="button" className={`assistant-trigger ${assistantOpen ? "active" : ""}`} onClick={() => { setAssistantOpen((open) => !open); setShareOpen(false); setDownloadOpen(false); }}>🤖 <span>AI 가이드</span></button>
      </div>
    </div>
  );
}
