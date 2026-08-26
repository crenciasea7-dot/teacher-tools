"use client";

import { useMemo, useState } from "react";

const won = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}만원`;

function monthlyPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0) return 0;
  const months = Math.max(years * 12, 1);
  const rate = annualRate / 100 / 12;
  if (rate === 0) return principal / months;
  return principal * rate * ((1 + rate) ** months) / (((1 + rate) ** months) - 1);
}

export function PropertyPurchaseSimulationTool() {
  const [price, setPrice] = useState(100000);
  const [cash, setCash] = useState(35000);
  const [annualIncome, setAnnualIncome] = useState(9000);
  const [existingAnnualDebt, setExistingAnnualDebt] = useState(0);
  const [rate, setRate] = useState(4.2);
  const [years, setYears] = useState(30);
  const [ltv, setLtv] = useState(70);
  const [extraRate, setExtraRate] = useState(4.5);

  const result = useMemo(() => {
    const extra = price * extraRate / 100;
    const needed = Math.max(price + extra - cash, 0);
    const ltvLimit = price * ltv / 100;
    const paymentPerTenThousand = monthlyPayment(10000, rate, years);
    const availableAnnualPayment = Math.max((annualIncome * 0.4) - existingAnnualDebt, 0);
    const dsrLimit = paymentPerTenThousand > 0 ? (availableAnnualPayment / 12) / paymentPerTenThousand * 10000 : 0;
    const loanLimit = Math.max(Math.min(ltvLimit, dsrLimit), 0);
    const gap = Math.max(needed - loanLimit, 0);
    const actualLoan = Math.min(needed, loanLimit);
    const payment = monthlyPayment(actualLoan, rate, years);
    const status = gap === 0 ? "구매 구조 가능" : gap <= price * 0.05 ? "자금 보완 필요" : "현재 조건 초과";
    return { actualLoan, dsrLimit, extra, gap, loanLimit, ltvLimit, needed, payment, status };
  }, [annualIncome, cash, existingAnnualDebt, extraRate, ltv, price, rate, years]);

  return (
    <main className="tool-shell">
      <a className="back" href="/">← AI 투자 도구 MASTER</a>
      <header><span>PROPERTY PURCHASE SIMULATION</span><h1>종합 시뮬레이션</h1><p>매수가·현금·소득·대출·부대비용을 한 화면에서 계산합니다.</p></header>
      <div className="privacy">입력값은 이 화면에서만 계산되며 서버에 저장되지 않습니다.</div>
      <section className="workspace">
        <form className="panel" onSubmit={(event) => event.preventDefault()}>
          <h2>구매 조건 입력 <small>단위: 만원</small></h2>
          <label htmlFor="price">매수가<input id="price" type="number" min="0" step="1000" value={price} onChange={(event) => setPrice(Number(event.target.value))}/></label>
          <label htmlFor="cash">사용 가능한 현금<input id="cash" type="number" min="0" step="1000" value={cash} onChange={(event) => setCash(Number(event.target.value))}/></label>
          <div className="two"><label htmlFor="income">연소득<input id="income" type="number" min="0" step="100" value={annualIncome} onChange={(event) => setAnnualIncome(Number(event.target.value))}/></label><label htmlFor="debt">기존 연간 원리금<input id="debt" type="number" min="0" step="100" value={existingAnnualDebt} onChange={(event) => setExistingAnnualDebt(Number(event.target.value))}/></label></div>
          <div className="two"><label htmlFor="rate">금리 (%)<input id="rate" type="number" min="0" max="20" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))}/></label><label htmlFor="years">상환기간 (년)<input id="years" type="number" min="1" max="50" value={years} onChange={(event) => setYears(Number(event.target.value))}/></label></div>
          <div className="two"><label htmlFor="ltv">적용 LTV (%)<input id="ltv" type="number" min="0" max="100" value={ltv} onChange={(event) => setLtv(Number(event.target.value))}/></label><label htmlFor="extra">취득세·중개 등 (%)<input id="extra" type="number" min="0" max="20" step="0.1" value={extraRate} onChange={(event) => setExtraRate(Number(event.target.value))}/></label></div>
        </form>
        <section className="result" aria-live="polite">
          <span className="eyebrow">시뮬레이션 결과</span><h2>{result.status}</h2>
          <div className="hero-number"><small>추가로 필요한 현금</small><strong>{won(result.gap)}</strong><p>매수가 외 부대비용 {won(result.extra)} 포함</p></div>
          <dl><div><dt>필요 대출</dt><dd>{won(result.needed)}</dd></div><div><dt>예상 대출 가능액</dt><dd>{won(result.loanLimit)}</dd></div><div><dt>예상 월 원리금</dt><dd>{won(result.payment)}</dd></div><div><dt>LTV 기준 한도</dt><dd>{won(result.ltvLimit)}</dd></div><div><dt>DSR 단순 추정 한도</dt><dd>{won(result.dsrLimit)}</dd></div></dl>
          <article><b>자금 구조</b><p>현금 {won(cash)} + 대출 {won(result.actualLoan)} + 부족분 {won(result.gap)}</p></article>
          <p className="note">DSR은 40%와 원리금균등상환을 단순 적용한 참고값입니다. 실제 한도·세금·규제는 금융기관과 전문가에게 확인하세요.</p>
        </section>
      </section>
      <style jsx>{`
        .tool-shell{min-height:100vh;padding:34px max(20px,calc((100vw - 1080px)/2)) 70px;background:#f3f6fa;color:#152237;font-family:Pretendard,Arial,sans-serif}.back{display:inline-block;margin-bottom:32px;color:#315f9f;text-decoration:none;font-weight:700}.tool-shell header span,.eyebrow{color:#315f9f;font-size:11px;font-weight:800;letter-spacing:.12em}.tool-shell header h1{margin:8px 0;font-size:clamp(38px,6vw,68px);letter-spacing:-.07em}.tool-shell header p{color:#718096}.privacy{margin:24px 0;padding:12px 15px;border:1px solid #cedcf2;border-radius:12px;background:#e9f0fb;color:#416184;font-size:13px}.workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.panel,.result{padding:26px;border:1px solid #dce3ed;border-radius:22px;background:#fff}.panel h2,.result h2{margin:0 0 20px}.panel h2 small{margin-left:6px;color:#718096;font-size:11px}.panel label{display:grid;gap:7px;margin-top:15px;color:#536175;font-size:13px;font-weight:700}.panel input{width:100%;padding:12px;border:1px solid #dce3ed;border-radius:10px;background:#fff;font:inherit}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.result>h2{margin-top:7px;font-size:34px;color:#315f9f}.hero-number{padding:20px;border-radius:16px;background:#e1ebfb}.hero-number small{display:block;color:#587398}.hero-number strong{display:block;margin:7px 0;font-size:30px}.hero-number p,.note{margin:0;color:#718096;font-size:12px;line-height:1.6}.result dl{margin:18px 0}.result dl div{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid #e7ecf3}.result dt{color:#718096}.result dd{margin:0;font-weight:800}.result article{padding:18px;border-radius:16px;background:#edf3fc}.result article p{margin:8px 0 0;line-height:1.65}.note{margin-top:16px}@media(max-width:760px){.workspace{grid-template-columns:1fr}.tool-shell{padding-top:22px}.panel,.result{padding:20px}.two{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
