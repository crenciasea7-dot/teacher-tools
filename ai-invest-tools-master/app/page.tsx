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

const toolMenuSections = [
  { label: "📈 세금", items: ["보유세 계산기", "양도세 (준비중)"] },
  { label: "🏗️ 재개발", items: ["재개발투자금", "재개발 매물 분석"] },
  { label: "💳 금융투자", items: ["구매력 계산기", "토탈 비용 시뮬레이션", "집 잔금 계산기", "포트폴리오 리벨런싱"] },
  { label: "📋 정책·자료 분석", items: ["주간 아파트 가격동향", "정부정책 분석 (준비중)", "자료 정리 & 인사이트 (준비중)"] },
  { label: "👤 자산관리", items: ["moyo 자산 대시보드", "금 추적 (준비중)"] },
  { label: "💰 매수매도", items: ["임장동선 (준비중)", "집 잔금 계산기", "집중 아파트 비교 리서치", "등기부 등본 분석", "아파트 매도 분석"] },
  { label: "🪙 비트코인", items: ["Fear & Greed Index (준비중)", "비트코인 레인보우 차트 (준비중)", "비트코인 도미넌스 (준비중)", "테더 도미넌스 (준비중)", "Glassnode 분석 (준비중)"] },
];

const categoryMap = [
  { icon: "◈", name: "자산관리", count: "2개", description: "지금 가진 자산을 한눈에 파악하고 기록합니다.", items: ["moyo 자산 대시보드", "금 추적"], href: "/asset-tracking" },
  { icon: "↗", name: "매수매도", count: "7개", description: "살 수 있는지부터 비교·계약·매도까지 이어갑니다.", items: ["구매력 계산기", "토탈 비용 시뮬레이션", "집중 아파트 비교"], href: "/investment-flow#buy" },
  { icon: "₿", name: "비트코인", count: "5개 지표", description: "공포탐욕과 사이클 지표를 같은 화면에서 봅니다.", items: ["공포탐욕", "레인보우 차트", "도미넌스"], href: "/bitcoin-indicators" },
  { icon: "⌂", name: "재개발", count: "3개", description: "정비사업 특유의 단계·권리·투자금을 점검합니다.", items: ["재개발 매물 분석", "재개발투자금", "inga-radar"], href: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/" },
  { icon: "↔", name: "금융투자", count: "5개", description: "부동산 밖 자산까지 비교해 배분을 판단합니다.", items: ["포트폴리오 리밸런싱", "국장이냐 미장이냐", "자료 인사이트"], href: "/rebalancing" },
  { icon: "％", name: "세금·대출", count: "4개", description: "보유부터 잔금과 총비용까지 숫자로 확인합니다.", items: ["보유세 계산기", "집 잔금 계산기", "토탈 비용"], href: "/property-tax" },
  { icon: "▤", name: "정책·자료 분석", count: "3개", description: "가격보다 먼저 정책과 시장 방향을 읽습니다.", items: ["주간 아파트 동향", "정부정책 분석", "자료 정리"], href: "/research-insights" },
];

export default function Page() {
  const [active, setActive] = useState("전체");
  const [showToolMenu, setShowToolMenu] = useState(false);
  const shown = active === "전체" ? tools : tools.filter((tool) => tool.group === active);

  return (
    <main>
      <div className="beta"><span>PUBLIC BETA</span><b>AI 투자 도구 MASTER · V1</b><p>작동 중인 도구를 계속 보완하고 있습니다.</p></div>
      <header><div className="brand"><i>AI</i><div><b>AI 투자 도구 MASTER</b><small>MY PERSONAL INVESTMENT TOOLKIT</small></div></div><div className="count"><strong>{tools.length}</strong><span>개의 도구</span></div></header>
      <section className="hero"><p>AI × INVESTMENT · A TO Z · V1</p><h1>몸은 편하게.<br/><em>부는 똑똑하게.</em></h1><span>거시 흐름을 먼저 읽고, 질문에 맞는 도구를 따라가며 판단하세요.<br/>Let AI Work. Live Rich.</span></section>
      <a className="os-banner" href="/investment-os"><span>NEW NAVIGATION</span><strong>투자 판단 OS</strong><small>부자의 뇌를 훔치는 알고리즘 · 준비중</small><b>열기 ↗</b></a>
      <MarketOverview />
      <section className="todays-judgment" aria-labelledby="todays-judgment-title"><div className="todays-judgment-heading"><span>TODAY'S DECISION</span><h2 id="todays-judgment-title">오늘의 판단</h2><p>지금 필요한 질문을 골라 해당 판단 화면으로 이동하세요.</p></div><div className="todays-judgment-list">{[{title:"지금 시장은?",href:"/investment-flow"},{title:"자료 정리 & 인사이트",href:"/research-insights"},{title:"살까?",href:"/investment-flow#buy"},{title:"팔까?",href:"/investment-flow#sell"},{title:"리밸런싱",href:"/rebalancing"}].map((pick,index)=><a href={pick.href} key={pick.title}><span><b>{String(index+1).padStart(2,"0")}</b>{pick.title}</span><strong>→</strong></a>)}</div></section>
      <blockquote className="market-philosophy">“지표를 읽되, 공포에 흔들리지 말고, 환호에 취하지도, 기회를 놓치지도 말 것”</blockquote>
      <section className="category-map" aria-labelledby="category-map-title">
        <div className="category-map-heading"><div><span>INFORMATION ARCHITECTURE · V1</span><h2 id="category-map-title">흩어진 도구를, <em>7개 카테고리</em>로.</h2><p>필요한 일을 먼저 고르면 관련 도구까지 바로 이어집니다.</p></div><a href="#tools">전체 도구 카드 보기 →</a></div>
        <div className="category-map-grid">{categoryMap.map((category) => {
          const external = category.href.startsWith("http");
          return <a href={category.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} key={category.name}><header><i>{category.icon}</i><h3>{category.name}</h3><b>{category.count}</b></header><p>{category.description}</p><ul>{category.items.map((item) => <li key={item}>{item}<span>→</span></li>)}</ul></a>;
        })}</div>
      </section>
      <section className="home-intelligence" aria-label="부동산과 정부 정책 분석">
        <a href="/weekly-apartment-analysis"><span>07 · WEEKLY HOUSING</span><h2>주간 아파트 가격 동향</h2><p>공식 데이터표 → 서울 세분화 → 추세 → 정성판단 → 국면진단 → 한 문장 결론</p><b>6단계 분석 보기 →</b></a>
        <a href="/research-insights"><span>08 · POLICY IMPACT</span><h2>정부정책 분석</h2><p>정책 원문을 넣고 매매가·대출·세금·심리 영향을 균형 있게 정리합니다.</p><b>정책 자료 분석하기 →</b></a>
      </section>
      <div className="tools-section-heading"><div><span>MY INVESTMENT TOOLKIT</span><h2>필요한 도구를 바로 꺼내세요.</h2></div><p>목적별로 골라 쓰고, 판단 과정은 하나의 흐름으로 이어갑니다.</p></div>
      <nav className="tool-filters" aria-label="도구 분류"><a className="os-nav-link" href="/investment-os">🧠 투자 판단 OS</a><button type="button" className={showToolMenu ? "on tool-menu-toggle" : "tool-menu-toggle"} aria-expanded={showToolMenu} onClick={() => setShowToolMenu((value) => !value)}>🛠️ 도구 모음 <span>{showToolMenu ? "닫기" : "펼치기"}</span></button>{groups.map((group) => <button type="button" onClick={() => setActive(group)} className={group === active ? "on" : ""} key={group}>{group}</button>)}</nav>
      {showToolMenu && <section className="tool-menu" aria-label="도구 모음 카테고리">{toolMenuSections.map((section) => <div className="tool-menu-section" key={section.label}><h2>{section.label}</h2><div>{section.items.map((name) => { const cleanName = name.replace(/ \(준비중\)$/, ""); const tool = tools.find((entry) => entry.name === cleanName); return tool?.url ? <a href={tool.url} target={tool.url.startsWith("http") ? "_blank" : undefined} rel={tool.url.startsWith("http") ? "noreferrer" : undefined} key={name}><strong>{cleanName}</strong><small>{tool.externalVendor ? "외부 업체" : "바로가기 ↗"}</small></a> : <span className="tool-menu-soon" key={name}><strong>{cleanName}</strong><small>준비중</small></span>; })}</div></div>)}</section>}
      <section className="tools" id="tools">
        {shown.map((tool) => {
          const external = tool.url?.startsWith("http");
          return <a className={`card ${tool.accent} ${!tool.url ? "soon" : ""}`} href={tool.url ?? "#"} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} key={tool.name} onClick={(event) => { if (!tool.url) event.preventDefault(); }}><i>{tool.icon}</i><div><span>{tool.group}</span><h2>{tool.name}{tool.externalVendor && <small className="vendor-badge">외부 업체</small>}</h2><p>{tool.description}</p></div><b>{tool.url ? (tool.cta ?? "바로가기 ↗") : "준비 중"}</b></a>;
        })}
      </section>
      <footer><div><b>AI INVESTMENT MASTER · v1.0</b><span>도구는 늘어나고, 판단은 더 선명해집니다.</span></div><div><b>DEVELOPED BY racha</b><span>학생 입력값은 서버에 저장하지 않습니다.</span></div></footer>
    </main>
  );
}
