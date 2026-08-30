"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const toolGroups = [
  { name: "자산관리", icon: "◈", links: [{ label: "자산 포트폴리오 현황", href: "/asset-tracking" }, { label: "알바비 관리", href: "https://alba-payroll-kr.crenciasea7.chatgpt.site/" }, { label: "AI 투자 프롬프트 스튜디오", href: "https://ai-invest-prompt-studio.vercel.app/" }] },
  { name: "매수매도", icon: "↗", links: [{ label: "임장동선 · 준비중", href: "" }, { label: "구매력 계산기", href: "https://purchasing-power-calculator.vercel.app/" }, { label: "집중 아파트 비교", href: "/apartment-research" }, { label: "집 잔금 계산기", href: "/jip-jangeum-calculator" }, { label: "등기부등본 분석 · 외부", href: "https://realpickai.kr/ai-registry" }, { label: "아파트 매도 분석", href: "https://gemini.google.com/gem/14MRd9ZNuQOWNFzkElSMIQs3Hbjy6yaj3?usp=sharing" }] },
  { name: "비트코인", icon: "₿", links: [{ label: "비트코인 판단 보드", href: "/bitcoin-indicators" }, { label: "공포탐욕·레인보우·도미넌스", href: "/bitcoin-indicators" }] },
  { name: "재개발", icon: "⌂", links: [{ label: "재개발 매물 분석", href: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/" }, { label: "재개발투자금", href: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/" }, { label: "재개발 분석기", href: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/" }, { label: "inga-radar", href: "https://inga-radar-seoul.vercel.app/" }] },
  { name: "금융투자", icon: "₩", links: [{ label: "금 추적", href: "/asset-tracking" }, { label: "투자 세금 기회비용 분석", href: "/rebalancing" }] },
  { name: "세금·대출", icon: "％", links: [{ label: "보유세 계산기", href: "/property-tax" }, { label: "토탈 비용 시뮬레이션", href: "/property-purchase-simulation" }, { label: "양도세 · 준비중", href: "" }] },
  { name: "정책·자료분석", icon: "▤", links: [{ label: "주간 아파트 동향", href: "/weekly-apartment-analysis" }, { label: "자료 정리 & 인사이트", href: "/research-insights" }] },
];

export default function PlatformNav() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };
  return (
    <div className="platform-nav-wrap">
      <nav className="platform-nav" aria-label="AI 투자 도구 V1 주요 메뉴">
        <Link href="/" className="platform-nav-brand"><i>AI</i><b>투자 A to Z</b><span>V1</span></Link>
        <div className="platform-nav-tabs">
          <Link href="/investment-os" className="investment-os-link">투자 판단</Link>
          {toolGroups.map((group) => <div className="top-category-wrap" key={`top-${group.name}`}><button type="button" className="top-category-link" aria-expanded={openCategory === group.name} onClick={() => setOpenCategory(openCategory === group.name ? null : group.name)}>{group.name} <span aria-hidden="true">▾</span></button></div>)}
          <button type="button" className={toolsOpen ? "tools-menu-trigger active" : "tools-menu-trigger"} aria-expanded={toolsOpen} aria-controls="tools-mega-menu" onClick={() => setToolsOpen((open) => !open)}>🛠 도구 모음 <span>{toolsOpen ? "−" : "+"}</span></button>
        </div>
        <div className="platform-ai-links" aria-label="외부 AI 바로가기">
          <a className="ai-icon-link" title="Gemini" aria-label="Gemini" href="https://gemini.google.com/" target="_blank" rel="noreferrer">G</a>
          <a className="ai-icon-link" title="ChatGPT" aria-label="ChatGPT" href="https://chatgpt.com/" target="_blank" rel="noreferrer">C</a>
          <a className="ai-icon-link" title="Claude" aria-label="Claude" href="https://claude.ai/" target="_blank" rel="noreferrer">A</a>
          <Link href="/signin-with-chatgpt" className="login-link">관리자</Link>
        </div>
      </nav>
      {openCategory && <section className="category-toggle-panel" aria-label={`${openCategory} 도구 목록`}><div className="category-toggle-inner"><strong>{openCategory}</strong><div>{toolGroups.find((group) => group.name === openCategory)?.links.map((link) => link.href ? <Link key={link.label} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined} onClick={() => setOpenCategory(null)}>{link.label}<b>→</b></Link> : <span key={link.label}>{link.label}</span>)}</div></div></section>}
      {toolsOpen && <section className="tools-mega-menu" id="tools-mega-menu" aria-label="전체 도구 모음">
        <div className="tools-mega-heading"><div><span>TOOL LIBRARY · V1.0</span><h2>무엇을 하려는지부터 고르세요.</h2></div><Link href="/#tools" onClick={() => setToolsOpen(false)}>전체 카드로 보기 →</Link></div>
        <div className="tools-mega-grid">{toolGroups.map((group) => <article key={group.name}><i>{group.icon}</i><h3>{group.name}</h3><div>{group.links.map((link) => link.href ? <Link href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined} onClick={() => setToolsOpen(false)} key={link.label}>{link.label}<b>→</b></Link> : <span key={link.label}>{link.label}</span>)}</div></article>)}</div>
        <p>학생·일반 사용자는 로그인 없이 이용하며, 입력값은 각 도구의 저장 안내에 따라 기기 안에서 관리합니다.</p>
      </section>}
    </div>
  );
}
