"use client";

import { useEffect, useMemo, useState } from "react";

type ToolStep = { name: string; description: string; href: string; external?: boolean };
type Question = { id: string; label: string; lead: string; tools: ToolStep[] };

const questions: Question[] = [
  { id: "market", label: "지금 시장은?", lead: "가격보다 먼저 방향과 정책의 온도를 확인합니다.", tools: [
    { name: "주간 아파트 가격 동향", description: "공식 데이터와 6단계 국면 진단", href: "/weekly-apartment-analysis" },
    { name: "정부정책 영향", description: "정책 원문을 넣고 다각도로 분석", href: "/research-insights" },
    { name: "거시경제 메크로", description: "주식·지수·금리·환율의 현재 흐름", href: "/#macro" },
  ]},
  { id: "cheap", label: "어떤 자산이 싸지?", lead: "절대가격이 아니라 다른 자산과 기회비용을 비교합니다.", tools: [
    { name: "Market Overview", description: "자산별 현재가·등락률·미니차트", href: "/#macro" },
    { name: "포트폴리오 리벨런싱", description: "국장·미장과 자산 간 비용 비교", href: "/rebalancing" },
    { name: "비트코인 참고 지표", description: "공포탐욕·레인보우·도미넌스 확인", href: "/bitcoin-indicators" },
  ]},
  { id: "buy", label: "사야 할까?", lead: "살 수 있는지, 총비용을 감당할 수 있는지, 대안보다 나은지 확인합니다.", tools: [
    { name: "구매력 계산기", description: "내 소득과 가진 돈으로 갈 수 있는 곳", href: "https://purchasing-power-calculator.vercel.app/", external: true },
    { name: "토탈 비용 시뮬레이션", description: "현금·대출·부대비용·월 상환액 계산", href: "/property-purchase-simulation" },
    { name: "집중 아파트 비교 리서치", description: "후보 단지와 임장 포인트 비교", href: "/apartment-research" },
    { name: "아파트 매도 분석", description: "향후 출구전략까지 미리 점검", href: "https://gemini.google.com/gem/14MRd9ZNuQOWNFzkElSMIQs3Hbjy6yaj3?usp=sharing", external: true },
    { name: "재개발 매물 분석", description: "투자금·권리·단계별 위험 확인", href: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/", external: true },
  ]},
  { id: "sell", label: "팔까?", lead: "내 호가만 보지 말고 시장·정책·대체투자까지 함께 확인합니다.", tools: [
    { name: "아파트 매도 분석", description: "내 호가와 거래·시장 반응 비교", href: "https://gemini.google.com/gem/14MRd9ZNuQOWNFzkElSMIQs3Hbjy6yaj3?usp=sharing", external: true },
    { name: "주간 아파트 가격 동향", description: "상승폭과 거래심리의 변화를 확인", href: "/weekly-apartment-analysis" },
    { name: "정부정책 영향", description: "매도 시점에 영향을 주는 정책 점검", href: "/research-insights" },
  ]},
  { id: "choose", label: "뭐 사지?", lead: "내 범위 안에서 후보를 만들고, 같은 기준으로 비교합니다.", tools: [
    { name: "구매력 계산기", description: "가능한 가격 범위를 먼저 확정", href: "https://purchasing-power-calculator.vercel.app/", external: true },
    { name: "주간 아파트 가격 동향", description: "지역별 현재 방향 확인", href: "/weekly-apartment-analysis" },
    { name: "재개발 매물 분석", description: "재개발과 일반주택의 자금·위험 비교", href: "https://redevelopment-deal-analyzer.crenciasea7.chatgpt.site/", external: true },
    { name: "집중 아파트 비교 리서치", description: "후보 압축과 임장 순서 정리", href: "/apartment-research" },
  ]},
];

export default function FlowGuide() {
  const [activeId, setActiveId] = useState("market");
  const [risk, setRisk] = useState("중립");
  const [horizon, setHorizon] = useState("3~5년");
  const [cash, setCash] = useState("확인 중");
  const active = questions.find((question) => question.id === activeId) ?? questions[0];
  useEffect(() => {
    const syncQuestionWithHash = () => {
      const id = window.location.hash.slice(1);
      if (questions.some((question) => question.id === id)) setActiveId(id);
    };
    syncQuestionWithHash();
    window.addEventListener("hashchange", syncQuestionWithHash);
    return () => window.removeEventListener("hashchange", syncQuestionWithHash);
  }, []);
  const insight = useMemo(() => {
    const riskGuide = risk === "보수" ? "손실 회피를 우선해 확인 항목을 모두 통과한 뒤 움직이세요." : risk === "적극" ? "기회를 보되 한 번에 전액을 투입하지 말고 시나리오를 나누세요." : "수익과 위험을 같은 비중으로 비교하세요.";
    const cashGuide = cash === "확정" ? "가용 현금이 정해졌으니 총비용과 비상자금을 분리하세요." : "먼저 실제 가용 현금과 대출 가능액부터 확정해야 합니다.";
    return `${active.label}를 판단하는 중입니다. ${horizon} 시계로 보고, ${riskGuide} ${cashGuide}`;
  }, [active.label, cash, horizon, risk]);

  return <div className="flow-board">
    <section className="flow-questions">{questions.map((question, index) => <button id={question.id} type="button" className={activeId === question.id ? "active" : ""} onClick={() => setActiveId(question.id)} key={question.id}><i>{index + 1}</i><b>{question.label}</b><span>{question.lead}</span></button>)}</section>
    <section className="flow-scenario"><div><span>MY SCENARIO</span><h2>나의 조건</h2></div><label>위험 성향<select value={risk} onChange={(event) => setRisk(event.target.value)}><option>보수</option><option>중립</option><option>적극</option></select></label><label>투자 기간<select value={horizon} onChange={(event) => setHorizon(event.target.value)}><option>1년 이내</option><option>3~5년</option><option>10년 이상</option></select></label><label>가용 현금<select value={cash} onChange={(event) => setCash(event.target.value)}><option>확인 중</option><option>확정</option></select></label></section>
    <section className="flow-result"><header><span>CURRENT QUESTION</span><h2>{active.label}</h2><p>{active.lead}</p></header><ol>{active.tools.map((tool, index) => <li key={tool.name}><i>{String(index + 1).padStart(2, "0")}</i><div><b>{tool.name}</b><span>{tool.description}</span></div><a href={tool.href} target={tool.external ? "_blank" : undefined} rel={tool.external ? "noreferrer" : undefined}>실행 →</a></li>)}</ol><div className="flow-external-checks"><a href="https://fin.land.naver.com/" target="_blank" rel="noreferrer">네이버 부동산 <small>외부 업체 ↗</small></a><a href="https://jaegebal.com/" target="_blank" rel="noreferrer">재개발닷컴 <small>외부 업체 ↗</small></a></div></section>
    <section className="flow-conclusion"><div><span>V1 AUTO INSIGHT</span><h2>그래서 나는?</h2></div><p>{insight}</p><b>① 순서대로 확인 ② 반대 근거도 찾기 ③ 행동 전 숫자로 재검증</b></section>
  </div>;
}
