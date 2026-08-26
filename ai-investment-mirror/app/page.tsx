"use client";

import { useMemo, useState } from "react";

const defaults = {
  target: "서울 재개발 후보 지역의 소형 아파트",
  thesis: "정비사업 진척과 전세 수요로 중장기 가치가 높아질 것이다.",
  evidence: "최근 실거래가, 사업 단계, 전세가율을 확인했다.",
  risk: "금리 상승과 사업 지연 시 보유 기간이 길어질 수 있다.",
  confidence: 7,
  horizon: "5년 이상",
};

export default function Home() {
  const [form, setForm] = useState(defaults);
  const [submitted, setSubmitted] = useState(false);
  const reflection = useMemo(() => {
    const issues: string[] = [];
    if (form.evidence.trim().length < 22) issues.push("근거가 아직 짧습니다. 숫자·출처·비교 대상을 하나 이상 더 적어보세요.");
    if (form.risk.trim().length < 22) issues.push("반대 시나리오가 약합니다. ‘내 판단이 틀릴 조건’을 한 문장으로 적어보세요.");
    if (form.confidence >= 8) issues.push("확신이 높은 편입니다. 가장 강한 반대 의견을 먼저 찾아보는 순서가 좋습니다.");
    if (form.horizon === "1년 이내") issues.push("짧은 보유 기간은 시장 타이밍의 영향을 크게 받습니다. 매도 기준을 숫자로 정해두세요.");
    return issues.length ? issues : ["판단의 근거와 위험을 모두 적었습니다. 이제 비교 매물 3개와 매수·매도 기준을 숫자로 고정해 보세요."];
  }, [form]);

  const update = (key: keyof typeof defaults, value: string | number) => setForm((previous) => ({ ...previous, [key]: value }));
  const score = Math.min(100, 44 + Math.min(form.evidence.length, 100) / 4 + Math.min(form.risk.length, 80) / 4 + (10 - form.confidence) * 2);

  return (
    <main>
      <header>
        <a className="brand" href="#top"><span>◐</span> AI 투자 거울</a>
        <p>정답을 대신 고르지 않고, 내 판단을 더 선명하게 봅니다.</p>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">INVESTMENT DECISION MIRROR</p>
        <h1>지금의 내 판단을<br /><em>한 번 더 비춰보세요.</em></h1>
        <p>좋은 투자 판단은 확신보다, 확인하지 않은 것을 아는 데서 시작됩니다.</p>
      </section>

      <section className="workspace">
        <form className="input-card" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
          <div className="card-heading"><div><p className="eyebrow">01 · 내 판단</p><h2>무엇을 고민하고 있나요?</h2></div><span>입력 후 거울 보기</span></div>
          <label>투자 대상<input value={form.target} onChange={(event) => update("target", event.target.value)} placeholder="예: 마포구 아파트" /></label>
          <label>내 가설<textarea value={form.thesis} onChange={(event) => update("thesis", event.target.value)} placeholder="왜 이 선택이 맞다고 생각하나요?" /></label>
          <label>확인한 근거<textarea value={form.evidence} onChange={(event) => update("evidence", event.target.value)} placeholder="실거래가, 수요, 정책, 사업 단계 등" /></label>
          <label>내 판단이 틀릴 조건<textarea value={form.risk} onChange={(event) => update("risk", event.target.value)} placeholder="가장 현실적인 반대 시나리오를 적어보세요." /></label>
          <div className="dual">
            <label>보유 기간<select value={form.horizon} onChange={(event) => update("horizon", event.target.value)}><option>1년 이내</option><option>3년 내외</option><option>5년 이상</option></select></label>
            <label>내 확신도 <b>{form.confidence}/10</b><input className="range" type="range" min="1" max="10" value={form.confidence} onChange={(event) => update("confidence", Number(event.target.value))} /></label>
          </div>
          <button type="submit">거울 보기 <span>↗</span></button>
        </form>

        <aside className={`mirror-card ${submitted ? "shown" : ""}`}>
          <div className="mirror-top"><div><p className="eyebrow">02 · 거울의 질문</p><h2>{submitted ? "판단을 비춰봤습니다." : "아직 비추는 중입니다."}</h2></div><div className="score"><b>{Math.round(score)}</b><span>점검도</span></div></div>
          <article className="thesis"><span>내 가설</span><p>“{form.thesis || "아직 가설을 적지 않았어요."}”</p></article>
          <div className="questions">
            {reflection.map((item, index) => <div className="question" key={item}><span>0{index + 1}</span><p>{item}</p></div>)}
          </div>
          <article className="next-step"><span>다음 행동</span><b>비교 대상 3개를 정하고, 매수하지 않을 조건을 숫자로 써보세요.</b></article>
          <p className="small-print">AI 투자 거울은 투자 결정을 대신하지 않습니다. 내 생각을 점검하는 보조 도구입니다.</p>
        </aside>
      </section>
    </main>
  );
}
