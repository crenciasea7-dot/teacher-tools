"use client";

import { useState } from "react";
import MarketOverview from "./components/market-overview";

type Tool = {
  icon: string;
  name: string;
  description: string;
  url?: string;
  cta?: string;
  group: string;
  accent: string;
  externalVendor?: boolean;
};

const tools: Tool[] = [
  { icon: "◈", name: "moyo 자산 대시보드", description: "로그인한 계정에서 부동산·금융자산·현금을 안전하게 관리", url: "https://moyo-private-asset-dashboard.crenciasea7.chatgpt.site/", group: "자산 관리", accent: "orange" },
  { icon: "▣", name: "보유세 계산기", description: "세무통과 다른 보유세 계산기를 로그인 없이 한곳에서 열기", url: "/property-tax", group: "자산 관리", accent: "orange" },
  { icon: "↗", name: "아파트 매도 분석", description: "내 호가와 최근 거래·시장 반응을 비교해 매도 전략을 점검", url: "https://gemini.google.com/gem/14MRd9ZNuQOWNFzkElSMIQs3Hbjy6yaj3?usp=sharing", group: "자산 관리", accent: "orange" },
  { icon: "⌁", name: "집 잔금 계산기", description: "입주 잔금과 대출 가능 범위를 로그인 없이 계산", url: "/jip-jangeum-calculator", group: "매수 판단", accent: "blue" },
  { icon: "◉", name: "투자거울", description: "투자 판단의 근거·리스크를 비춰보기", group: "매수 판단", accent: "blue" },
  { icon: "⌕", name: "집중 아파트 비교 리서치", description: "후보 아파트를 로그인 없이 비교하고 핵심을 정리", url: "/apartment-research", group: "매수 판단", accent: "blue" },
  { icon: "▤", name: "등기부 등본 분석", description: "등기부등본의 위험 항목·법적 이슈·권리관계를 AI로 점검", url: "https://realpickai.kr/ai-registry", group: "매수 판단", accent: "blue", externalVendor: true },
  { icon: "₩", name: "구매력 계산기", description: "내 소득과 가진 돈으로 갈 수 있는 곳", url: "https://purchasing-power-calculator.vercel.app/", group: "매수 판단", accent: "blue" },
  { icon: "Σ", name: "토탈 비용 시뮬레이션", description: "현금·대출·부대비용·월 상환액을 한 번에 계산", url: "/property-purchase-simulation", group: "매수 판단", accent: "blue" },
  { icon: "路", name: "임장동선", description: "후보 단지의 방문 순서와 이동 동선을 한 번에 정리", group: "매수 판단", accent: "blue" },
  { icon: "↔", name: "국장이냐 미장이냐", description: "세금을 고려해 국내주식과 미국주식의 투자비용을 비교", url: "https://simplewoody.com/ko/investment/investment-tax-cost.html", cta: "자세히 보기 ↗", group: "포트폴리오 리벨런싱", accent: "purple", externalVendor: true },
  { icon: "⌂", name: "주식이냐 부동산이냐", description: "주식과 부동산의 자산배분 판단 도구를 준비하고 있습니다", group: "포트폴리오 리벨런싱", accent: "purple" },
  { icon: "+", name: "기타", description: "추가 리벨런싱 도구를 위한 공간", group: "포트폴리오 리벨런싱", accent: "purple" },
  { icon: "⌖", name: "재개발 매물 분석", description: "정비사업 매물의 단계·권리·리스크 점검", url: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/", group: "정비사업", accent: "green" },
  { icon: "₩", name: "재개발투자금", description: "재개발 매물의 필요 투자금과 권리·위험을 함께 확인", url: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/", group: "정비사업", accent: "green" },
  { icon: "R", name: "inga-radar", description: "서울 재개발·재건축 인허가 신호 추적", group: "정비사업", accent: "green" },
  { icon: "R", name: "주간 아파트 가격동향", description: "공식 주간 통계와 6단계 AI 시장 국면 분석", url: "/weekly-apartment-analysis", group: "AI 투자 루틴", accent: "purple" },
  { icon: "✦", name: "자료 정리 & 인사이트", description: "복잡한 보고서와 정책 자료를 요약하고 나에게 미치는 영향까지 축적", url: "/research-insights", cta: "자료 넣고 분석하기 →", group: "AI 투자 루틴", accent: "purple" },
  { icon: "AI", name: "AI 투자 프롬프트 스튜디오", description: "매수 전부터 계약까지 질문으로 따라가기", url: "https://ai-invest-prompt-studio.vercel.app/", group: "AI 투자 루틴", accent: "purple" },
  { icon: "+", name: "알바비 관리", description: "근무시간을 입력해 기본급·주휴·연장·야간수당 계산", url: "https://alba-payroll-kr.crenciasea7.chatgpt.site/", group: "생활 관리", accent: "pink" },
  { icon: "₿", name: "비트코인 참고 지표", description: "공포탐욕·레인보우·도미넌스·온체인 지표를 한곳에서 확인", url: "/bitcoin-indicators", cta: "판단 보드 열기 →", group: "암호화폐 판단", accent: "purple" },
];

const groups = ["전체", ...Array.from(new Set(tools.map((tool) => tool.group)))];

export default function Page() {
  const [active, setActive] = useState("전체");
  const shown = active === "전체" ? tools : tools.filter((tool) => tool.group === active);

  return (
    <main>
      <div className="beta"><span>PUBLIC BETA</span><b>AI 투자 도구 MASTER · V1</b><p>작동 중인 도구를 계속 보완하고 있습니다.</p></div>
      <header><div className="brand"><i>AI</i><div><b>AI 투자 도구 MASTER</b><small>MY PERSONAL INVESTMENT TOOLKIT</small></div></div><div className="count"><strong>{tools.length}</strong><span>개의 도구</span></div></header>
      <section className="hero"><p>AI × INVESTMENT · A TO Z · V1</p><h1>몸은 편하게.<br/><em>부는 똑똑하게.</em></h1><span>거시 흐름을 먼저 읽고, 질문에 맞는 도구를 따라가며 판단하세요.<br/>Let AI Work. Live Rich.</span></section>
      <MarketOverview />
      <blockquote className="market-philosophy">“지표를 읽되, 공포에 흔들리지 말고, 환호에 취하지도, 기회를 놓치지도 말 것”</blockquote>
      <section className="home-intelligence" aria-label="부동산과 정부 정책 분석">
        <a href="/weekly-apartment-analysis"><span>07 · WEEKLY HOUSING</span><h2>주간 아파트 가격 동향</h2><p>공식 데이터표 → 서울 세분화 → 추세 → 정성판단 → 국면진단 → 한 문장 결론</p><b>6단계 분석 보기 →</b></a>
        <a href="/research-insights"><span>08 · POLICY IMPACT</span><h2>정부정책 분석</h2><p>정책 원문을 넣고 매매가·대출·세금·심리 영향을 균형 있게 정리합니다.</p><b>정책 자료 분석하기 →</b></a>
      </section>
      <nav>{groups.map((group) => <button type="button" onClick={() => setActive(group)} className={group === active ? "on" : ""} key={group}>{group}</button>)}</nav>
      <section className="tools" id="tools">
        {shown.map((tool) => {
          const external = tool.url?.startsWith("http");
          return <a className={`card ${tool.accent} ${!tool.url ? "soon" : ""}`} href={tool.url ?? "#"} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} key={tool.name} onClick={(event) => { if (!tool.url) event.preventDefault(); }}><i>{tool.icon}</i><div><span>{tool.group}</span><h2>{tool.name}{tool.externalVendor && <small className="vendor-badge">외부 업체</small>}</h2><p>{tool.description}</p></div><b>{tool.url ? (tool.cta ?? "바로가기 ↗") : "준비 중"}</b></a>;
        })}
      </section>
      <footer><b>AI INVESTMENT MASTER</b><span>도구는 늘어나고, 판단은 더 선명해집니다.</span></footer>
    </main>
  );
}
