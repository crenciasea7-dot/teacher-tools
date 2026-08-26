"use client";

import { useMemo, useState } from "react";

const money = (value: number) => `${value.toFixed(2).replace(/\.00$/, "")}억`;

export function ApartmentSalesAnalysisTool() {
  const [askingPrice, setAskingPrice] = useState(16);
  const [recentPrice, setRecentPrice] = useState(15.2);
  const [competingPrice, setCompetingPrice] = useState(15.5);
  const [months, setMonths] = useState(6);
  const [inquiries, setInquiries] = useState(0);
  const [visits, setVisits] = useState(0);
  const [advantages, setAdvantages] = useState(2);

  const result = useMemo(() => {
    const premium = recentPrice > 0 ? ((askingPrice / recentPrice) - 1) * 100 : 0;
    const advantageRate = Math.min(advantages, 4) * 0.006;
    const urgencyRate = months <= 3 ? -0.02 : months <= 6 ? -0.01 : 0;
    const center = recentPrice * (1 + advantageRate + urgencyRate);
    const lower = center * 0.985;
    const upper = center * 1.015;
    const noResponse = inquiries === 0 && visits === 0;
    const status = askingPrice <= upper && !noResponse ? "유지 가능" : askingPrice <= upper * 1.03 ? "조건부 유지" : "가격 재점검";
    const action = noResponse
      ? "대표 사진·설명·중개 노출을 먼저 손보고 2주간 문의와 방문을 기록하세요."
      : visits > 0
        ? "방문 후 제안 가격과 거절 이유를 모아 다음 가격 조정폭을 정하세요."
        : "문의가 방문으로 이어지지 않는 이유를 중개사에게 확인하세요.";
    return { premium, lower, upper, status, action };
  }, [advantages, askingPrice, inquiries, months, recentPrice, visits]);

  return (
    <main className="tool-shell">
      <a className="back" href="/">← AI 투자 도구 MASTER</a>
      <header><span>APARTMENT SALES ANALYSIS</span><h1>아파트 매도 분석</h1><p>내 호가를 최근 거래·경쟁 매물·실제 시장 반응과 함께 봅니다.</p></header>
      <div className="privacy">입력값은 이 화면에서만 계산되며 서버에 저장되지 않습니다.</div>
      <section className="workspace">
        <form className="panel" onSubmit={(event) => event.preventDefault()}>
          <h2>현재 상황 입력</h2>
          <label htmlFor="asking">내 현재 호가 (억원)<input id="asking" type="number" min="0" step="0.01" value={askingPrice} onChange={(event) => setAskingPrice(Number(event.target.value))}/></label>
          <label htmlFor="recent">비슷한 층·평형 최근 실거래 (억원)<input id="recent" type="number" min="0" step="0.01" value={recentPrice} onChange={(event) => setRecentPrice(Number(event.target.value))}/></label>
          <label htmlFor="competing">가장 강한 경쟁 매물 (억원)<input id="competing" type="number" min="0" step="0.01" value={competingPrice} onChange={(event) => setCompetingPrice(Number(event.target.value))}/></label>
          <label htmlFor="months">희망 매도까지 남은 개월<input id="months" type="number" min="1" max="36" value={months} onChange={(event) => setMonths(Number(event.target.value))}/></label>
          <div className="two"><label htmlFor="inquiries">최근 문의 수<input id="inquiries" type="number" min="0" value={inquiries} onChange={(event) => setInquiries(Number(event.target.value))}/></label><label htmlFor="visits">최근 방문팀<input id="visits" type="number" min="0" value={visits} onChange={(event) => setVisits(Number(event.target.value))}/></label></div>
          <label htmlFor="advantages">수리·조망·향·입주 등 강점 수<input id="advantages" type="range" min="0" max="4" value={advantages} onChange={(event) => setAdvantages(Number(event.target.value))}/><output htmlFor="advantages">{advantages}개</output></label>
        </form>
        <section className="result" aria-live="polite">
          <span className="eyebrow">현재 판단</span><h2>{result.status}</h2>
          <div className="band"><small>참고 가격 밴드</small><strong>{money(result.lower)} ~ {money(result.upper)}</strong><p>사용자가 넣은 최근 거래와 강점·기한만으로 계산한 참고 범위입니다.</p></div>
          <dl><div><dt>최근 거래 대비 내 호가</dt><dd>{result.premium >= 0 ? "+" : ""}{result.premium.toFixed(1)}%</dd></div><div><dt>경쟁 매물과 차이</dt><dd>{money(askingPrice - competingPrice)}</dd></div></dl>
          <article><b>다음 행동</b><p>{result.action}</p></article>
          <p className="note">실제 가격 결정 전에는 동일 타입·층·입주 조건과 최신 실거래를 다시 확인하세요.</p>
        </section>
      </section>
      <style jsx>{`
        .tool-shell{min-height:100vh;padding:34px max(20px,calc((100vw - 1080px)/2)) 70px;background:#f4f6f3;color:#182329;font-family:Pretendard,Arial,sans-serif}.back{display:inline-block;margin-bottom:32px;color:#1b7666;text-decoration:none;font-weight:700}.tool-shell header span,.eyebrow{color:#b95229;font-size:11px;font-weight:800;letter-spacing:.12em}.tool-shell header h1{margin:8px 0;font-size:clamp(38px,6vw,68px);letter-spacing:-.07em}.tool-shell header p{color:#74817e}.privacy{margin:24px 0;padding:12px 15px;border:1px solid #cce5dc;border-radius:12px;background:#eaf5f0;color:#46655d;font-size:13px}.workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.panel,.result{padding:26px;border:1px solid #dfe5e1;border-radius:22px;background:#fffefa}.panel h2,.result h2{margin:0 0 20px}.panel label{display:grid;gap:7px;margin-top:15px;color:#56635f;font-size:13px;font-weight:700}.panel input{width:100%;padding:12px;border:1px solid #dfe5e1;border-radius:10px;background:#fff;font:inherit}.panel input[type=range]{padding:0}.panel output{color:#1b7666}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.result>h2{margin-top:7px;font-size:34px;color:#b95229}.band{padding:20px;border-radius:16px;background:#fce4d5}.band small{display:block;color:#8a5b46}.band strong{display:block;margin:7px 0;font-size:26px}.band p,.note{margin:0;color:#74817e;font-size:12px;line-height:1.6}.result dl{margin:18px 0}.result dl div{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e7ebe8}.result dt{color:#74817e}.result dd{margin:0;font-weight:800}.result article{padding:18px;border-radius:16px;background:#eaf5f0}.result article p{margin:8px 0 0;line-height:1.65}.note{margin-top:16px}@media(max-width:760px){.workspace{grid-template-columns:1fr}.tool-shell{padding-top:22px}.panel,.result{padding:20px}.two{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
