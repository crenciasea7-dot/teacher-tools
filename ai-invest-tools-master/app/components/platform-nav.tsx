"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "홈" },
  { href: "/investment-flow", label: "투자 판단" },
  { href: "/research-insights", label: "자료·인사이트" },
  { href: "/insights", label: "블로그" },
  { href: "/asset-tracking", label: "자산 추적" },
  { href: "/rebalancing", label: "리밸런싱" },
  { href: "/bitcoin-indicators", label: "비트코인" },
  { href: "/#tools", label: "도구 모음" },
];

export default function PlatformNav() {
  const pathname = usePathname();
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
        </div>
        <div className="platform-ai-links" aria-label="외부 AI 바로가기">
          <a href="https://gemini.google.com/" target="_blank" rel="noreferrer">Gemini</a>
          <a href="https://chatgpt.com/" target="_blank" rel="noreferrer">ChatGPT</a>
          <a href="https://claude.ai/" target="_blank" rel="noreferrer">Claude</a>
        </div>
      </nav>
    </div>
  );
}
