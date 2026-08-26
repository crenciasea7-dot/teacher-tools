"use client";

import { useState } from "react";

type Step = { no: string; title: string; description: string; prompt: string; tags: string[]; };
const steps: Step[] = [
  { no: "01", title: "내 기준부터 세우기", description: "예산, 보유자산, 목적을 먼저 정리합니다.", tags: ["예산", "목표", "대출"], prompt: "나는 실거주/투자 목적의 아파트 매수를 검토 중이야.\n보유 현금은 [ ]원, 연소득은 [ ]원, 기존 대출은 [ ]원이고,\n희망 지역은 [ ], 보유 기간은 [ ]년이야.\n\n나의 현실적인 매수 가능 가격대, 필요한 자기자본,\n무리하지 않는 월 상환액을 표로 정리해줘. 계산의 가정도 함께 밝혀줘." },
  { no: "02", title: "후보 단지 좁히기", description: "감이 아니라 비교 기준으로 후보를 거릅니다.", tags: ["입지", "가격", "비교"], prompt: "[지역]에서 [예산] 안으로 매수 후보 아파트를 찾고 있어.\n아래 기준으로 비교할 수 있는 표를 만들어줘.\n- 교통·생활권·학군\n- 최근 실거래 흐름과 평당 가격\n- 공급 및 입주 물량\n- 재건축·재개발·정비사업 가능성\n- 실거주와 투자 각각의 장단점\n\n확인할 수 없는 정보는 추정하지 말고 '직접 확인 필요'로 표시해줘." },
  { no: "03", title: "단지의 진짜 가치 읽기", description: "숫자 뒤의 수요·공급·리스크를 확인합니다.", tags: ["수요", "공급", "리스크"], prompt: "[아파트명]을 매수 후보로 검토 중이야.\n매수자 관점에서 이 단지의 가치를 분석해줘.\n\n1. 누가 왜 이 단지를 찾는지\n2. 가격을 지지하거나 누를 공급 요인\n3. 비슷한 대체 단지와 비교해 강점·약점\n4. 향후 3년의 긍정·기준·부정 시나리오\n5. 내가 현장과 공식 자료에서 꼭 확인할 질문 10개\n\n사실, 해석, 가정을 분리해서 작성해줘." },
  { no: "04", title: "매수 타이밍 점검", description: "'살까 말까'를 조건과 신호로 판단합니다.", tags: ["타이밍", "협상", "시나리오"], prompt: "[아파트명]의 현재 호가/최근 거래가는 [ ]원이야.\n내가 생각하는 매수가격은 [ ]원이고, 보유기간은 [ ]년이야.\n\n지금 매수할 근거와 기다릴 근거를 균형 있게 비교해줘.\n특히 매도자와 협상할 때 확인할 정보,\n가격 조정이 필요해지는 신호, 매수를 멈춰야 할 조건을 제시해줘.\n결론을 단정하지 말고 의사결정 체크리스트로 정리해줘." },
  { no: "05", title: "계약 전 최종 검증", description: "계약서에 서명하기 전 빠뜨릴 것을 막습니다.", tags: ["등기", "대출", "계약"], prompt: "아파트 매매계약 직전이야. 다음을 기준으로 누락 없는 점검표를 만들어줘.\n- 등기부등본, 건축물대장, 토지이용계획\n- 임차인·전세보증금·근저당 등 권리관계\n- 자금조달계획, 대출 실행, 잔금 일정\n- 특약에 넣을 수 있는 확인 문구\n- 계약금 지급 전 반드시 확인할 항목\n\n법률·세무·대출 판단은 전문가 확인이 필요하다는 안내도 포함해줘." }
];

export default function Page() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const step = steps[active];
  async function copyPrompt() { await navigator.clipboard?.writeText(step.prompt); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <main><header><div className="brand"><span>AI</span><div><b>AI 투자 프롬프트 스튜디오</b><small>BUYER&apos;S DECISION GUIDE</small></div></div><button className="start" onClick={() => document.getElementById("journey")?.scrollIntoView({ behavior: "smooth" })}>매수 여정 시작하기 <i>↓</i></button></header>
    <section className="hero"><p className="eyebrow">FROM FIRST QUESTION TO CONTRACT</p><h1>좋은 매수는<br /><em>좋은 질문</em>에서 시작됩니다.</h1><p>복잡한 부동산 매수 과정을 다섯 개의 질문으로 나누고,<br />각 단계에서 바로 쓸 수 있는 AI 프롬프트를 준비했습니다.</p><div className="hero-note"><span>매수자 가이드</span><b>나의 조건 → 후보 비교 → 계약 전 검증</b></div></section>
    <section className="journey" id="journey"><aside><p className="eyebrow">BUYING JOURNEY</p><h2>지금 어디까지<br />왔나요?</h2>{steps.map((item, index) => <button key={item.no} className={active === index ? "selected" : ""} onClick={() => { setActive(index); setCopied(false); }}><span>{item.no}</span><div><b>{item.title}</b><small>{item.description}</small></div><i>→</i></button>)}</aside>
      <article className="studio"><div className="studio-head"><div><p className="eyebrow">STEP {step.no} · PROMPT WORKBENCH</p><h2>{step.title}</h2><p>{step.description}</p></div><div className="tags">{step.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><div className="prompt"><div><span>AI에게 이렇게 물어보세요</span><button onClick={copyPrompt}>{copied ? "복사 완료 ✓" : "프롬프트 복사"}</button></div><pre>{step.prompt}</pre></div><div className="tip"><span>✦</span><p><b>사용 팁</b> 대괄호 <code>[ ]</code> 안의 내용을 내 상황에 맞게 채운 뒤, ChatGPT·Claude·Gemini 등 원하는 AI에 넣어보세요.</p></div><div className="guard"><b>중요한 원칙</b><span>AI의 답은 판단을 돕는 초안입니다. 실거래·공식 문서·전문가 확인을 거쳐 최종 결정하세요.</span></div></article></section>
    <footer><span>AI INVEST PROMPT STUDIO</span><p>매수를 서두르지 않게 만드는 질문 도구</p></footer></main>;
}
