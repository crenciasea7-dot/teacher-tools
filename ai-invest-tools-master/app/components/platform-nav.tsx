"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tabs = [
  { href: "/", label: "홈" },
  { href: "/investment-flow", label: "투자 판단" },
  { href: "/research-insights", label: "자료·인사이트" },
  { href: "/insights", label: "블로그" },
  { href: "/asset-tracking", label: "자산 추적" },
  { href: "/rebalancing", label: "리밸런싱" },
  { href: "/bitcoin-indicators", label: "비트코인" },
];

const toolGroups = [
  { name: "세금·대출", icon: "％", links: [{ label: "보유세 계산기", href: "/property-tax" }, { label: "양도세 · 준비중", href: "" }, { label: "집 잔금 계산기", href: "/jip-jangeum-calculator" }] },
  { name: "재개발", icon: "⌂", links: [{ label: "재개발투자금", href: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/" }, { label: "재개발 분석기", href: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/" }] },
  { name: "금융투자", icon: "₩", links: [{ label: "구매력 계산기", href: "https://purchasing-power-calculator.vercel.app/" }, { label: "토탈 비용 시뮬레이션", href: "/property-purchase-simulation" }, { label: "집 잔금 계산기", href: "/jip-jangeum-calculator" }, { label: "집중 아파트 비교", href: "/apartment-research" }, { label: "포트폴리오 리밸런싱", href: "/rebalancing" }] },
  { name: "정책·자료", icon: "▤", links: [{ label: "주간 아파트 동향", href: "/weekly-apartment-analysis" }, { label: "정부정책 분석", href: "/research-insights" }, { label: "자료 정리 & 인사이트", href: "/research-insights" }] },
  { name: "자산관리", icon: "◈", links: [{ label: "자산 추적 moyo", href: "/asset-tracking" }, { label: "금 추적", href: "/asset-tracking" }] },
  { name: "매수매도", icon: "↗", links: [{ label: "임장동선 · 준비중", href: "" }, { label: "집 잔금 계산기", href: "/jip-jangeum-calculator" }, { label: "집중 아파트 비교", href: "/apartment-research" }, { label: "등기부등본 분석 · 외부", href: "https://realpickai.kr/ai-registry" }, { label: "아파트 매도 분석", href: "https://gemini.google.com/gem/14MRd9ZNuQOWNFzkElSMIQs3Hbjy6yaj3?usp=sharing" }] },
  { name: "비트코인", icon: "₿", links: [{ label: "비트코인 판단 보드", href: "/bitcoin-indicators" }, { label: "공포탐욕·레인보우·도미넌스", href: "/bitcoin-indicators" }] },
];

export default function PlatformNav() {
  const pathname = usePathname();
  const [toolsOpen, setToolsOpen] = useState(false);
  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };
  return (
    <div className="platform-nav-wrap">
      <nav className="platform-nav" aria-label="AI 투자 도구 V1 주요 메뉴">
        <Link href="/" className="platform-nav-brand"><i>AI</i><b>투자 A to Z</b><span>V1</span></Link>
        <div className="platform-nav-tabs">
          {tabs.map((tab) => <Link href={tab.href} className={isActive(tab.href) ? "active" : ""} key={tab.href}>{tab.label}</Link>)}
          {toolGroups.map((group) => <Link href={`/#tools-${group.name}`} className="top-category-link" key={`top-${group.name}`}>{group.name}</Link>)}
          <button type="button" className={toolsOpen ? "tools-menu-trigger active" : "tools-menu-trigger"} aria-expanded={toolsOpen} aria-controls="tools-mega-menu" onClick={() => setToolsOpen((open) => !open)}>🛠 도구 모음 <span>{toolsOpen ? "−" : "+"}</span></button>
        </div>
        <div className="platform-ai-links" aria-label="외부 AI 바로가기">
          <a href="https://gemini.google.com/" target="_blank" rel="noreferrer">Gemini</a>
          <a href="https://chatgpt.com/" target="_blank" rel="noreferrer">ChatGPT</a>
          <a href="https://claude.ai/" target="_blank" rel="noreferrer">Claude</a>
        </div>
      </nav>
      {toolsOpen && <section className="tools-mega-menu" id="tools-mega-menu" aria-label="전체 도구 모음">
        <div className="tools-mega-heading"><div><span>TOOL LIBRARY · V1.0</span><h2>무엇을 하려는지부터 고르세요.</h2></div><Link href="/#tools" onClick={() => setToolsOpen(false)}>전체 카드로 보기 →</Link></div>
        <div className="tools-mega-grid">{toolGroups.map((group) => <article key={group.name}><i>{group.icon}</i><h3>{group.name}</h3><div>{group.links.map((link) => link.href ? <Link href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined} onClick={() => setToolsOpen(false)} key={link.label}>{link.label}<b>→</b></Link> : <span key={link.label}>{link.label}</span>)}</div></article>)}</div>
        <p>학생·일반 사용자는 로그인 없이 이용하며, 입력값은 각 도구의 저장 안내에 따라 기기 안에서 관리합니다.</p>
      </section>}
    </div>
  );
}
