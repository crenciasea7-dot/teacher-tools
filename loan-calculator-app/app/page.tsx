"use client";

import { useMemo, useState } from "react";

const won = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const eok = (value: number) => `${(value / 100_000_000).toFixed(value >= 100_000_000 ? 1 : 2).replace(/\.0$/, "")}억원`;

function annualPaymentFactor(rate: number, years: number) {
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  if (!monthlyRate) return 12 / months;
  return 12 * (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
}

export default function Home() {
  const [price, setPrice] = useState(90000);
  const [paid, setPaid] = useState(36000);
  const [regulated, setRegulated] = useState(false);
  const [bank, setBank] = useState(true);
  const [income1, setIncome1] = useState(7000);
  const [income2, setIncome2] = useState(6200);
  const [income3, setIncome3] = useState(5800);
  const [existingAnnual, setExistingAnnual] = useState(600);
  const [rate, setRate] = useState(4.5);
  const [years, setYears] = useState(30);

  const result = useMemo(() => {
    const p = price * 10_000;
    const remaining = Math.max(0, (price - paid) * 10_000);
    const growth = income2 > 0 ? ((income1 - income2) / income2) * 100 : 0;
    let assessedIncome = income1;
    let incomeRule = "최근 1개년 소득";
    if (growth > 30) {
      assessedIncome = (income1 + income2 + income3) / 3;
      incomeRule = "상승률 30% 초과: 최근 3개년 평균";
    } else if (growth > 20) {
      assessedIncome = (income1 + income2) / 2;
      incomeRule = "상승률 20% 초과: 최근 2개년 평균";
    }
    const ltv = regulated ? 0.4 : 0.7;
    const ltvLimit = p * ltv;
    const priceCap = p <= 1_500_000_000 ? 600_000_000 : p <= 2_500_000_000 ? 400_000_000 : 200_000_000;
    const dsrRate = bank ? 0.4 : 0.5;
    const availableAnnual = Math.max(0, assessedIncome * 10_000 * dsrRate - existingAnnual * 10_000);
    const dsrLimit = availableAnnual / annualPaymentFactor(rate, years);
    const final = Math.max(0, Math.min(remaining, ltvLimit, priceCap, dsrLimit));
    const binding = [
      ["필요 잔금", remaining], ["LTV", ltvLimit], ["주택가격별 한도", priceCap], ["DSR", dsrLimit],
    ].sort((a, b) => Number(a[1]) - Number(b[1]))[0][0];
    return { remaining, assessedIncome, incomeRule, ltv, ltvLimit, priceCap, dsrRate, dsrLimit, final, binding };
  }, [price, paid, regulated, bank, income1, income2, income3, existingAnnual, rate, years]);

  const Field = ({ label, value, onChange, suffix = "만원" }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) => (
    <label className="field"><span>{label}</span><div><input type="number" min="0" value={value} onChange={(e) => onChange(Number(e.target.value))} /><b>{suffix}</b></div></label>
  );

  return (
    <main>
      <header className="topbar"><div className="brand"><span>집</span>잔금계산</div><a href="#basis">적용 기준</a></header>

      <section className="hero">
        <div className="eyebrow">2027년 입주 예정 아파트</div>
        <h1>내 잔금대출,<br />얼마까지 가능할까요?</h1>
        <p>분양가와 소득을 입력하면 LTV, DSR, 주택가격별 한도를 한 번에 비교해 가장 보수적인 예상치를 보여드립니다.</p>
        <div className="source-chip">금융위원회 2026. 8. 13. 종합대책 기준</div>
      </section>

      <section className="calculator">
        <div className="inputs card">
          <div className="section-title"><span>01</span><div><h2>분양·입주 정보</h2><p>계약서상의 금액을 입력하세요.</p></div></div>
          <div className="grid two"><Field label="분양가" value={price} onChange={setPrice} /><Field label="입주 전까지 납부액" value={paid} onChange={setPaid} /></div>
          <div className="field full"><span>입주지역</span><div className="segmented"><button className={!regulated ? "active" : ""} onClick={() => setRegulated(false)}>비규제지역</button><button className={regulated ? "active" : ""} onClick={() => setRegulated(true)}>규제지역</button></div></div>

          <div className="divider" />
          <div className="section-title"><span>02</span><div><h2>소득·부채 정보</h2><p>2027년 시행 예정 소득산정 기준을 적용합니다.</p></div></div>
          <div className="grid three"><Field label="최근 1년 소득" value={income1} onChange={setIncome1} /><Field label="2년 전 소득" value={income2} onChange={setIncome2} /><Field label="3년 전 소득" value={income3} onChange={setIncome3} /></div>
          <div className="grid two"><Field label="기존 대출 연간 원리금" value={existingAnnual} onChange={setExistingAnnual} /><div className="field"><span>대출기관</span><div className="segmented"><button className={bank ? "active" : ""} onClick={() => setBank(true)}>은행권</button><button className={!bank ? "active" : ""} onClick={() => setBank(false)}>2금융권</button></div></div></div>

          <div className="divider" />
          <div className="section-title"><span>03</span><div><h2>예상 대출 조건</h2><p>은행 상담 시 제시받은 조건으로 바꿔보세요.</p></div></div>
          <div className="grid two"><Field label="예상 금리" value={rate} onChange={setRate} suffix="%" /><Field label="상환기간" value={years} onChange={setYears} suffix="년" /></div>
        </div>

        <aside className="result card" aria-live="polite">
          <div className="result-label">예상 가능 잔금대출</div>
          <div className="big-number">{eok(result.final)}</div>
          <div className="binding">현재 한도를 결정하는 기준: <b>{result.binding}</b></div>
          <div className="bars">
            {[["필요 잔금", result.remaining], [`LTV ${(result.ltv * 100).toFixed(0)}%`, result.ltvLimit], ["주택가격별 상한", result.priceCap], [`DSR ${(result.dsrRate * 100).toFixed(0)}%`, result.dsrLimit]].map(([name, amount]) => {
              const n = Number(amount); const max = Math.max(result.remaining, result.ltvLimit, result.priceCap, result.dsrLimit, 1);
              return <div className="bar-row" key={String(name)}><div><span>{name}</span><b>{eok(n)}</b></div><div className="track"><i style={{ width: `${Math.max(3, n / max * 100)}%` }} /></div></div>;
            })}
          </div>
          <div className="income-box"><span>DSR 인정소득</span><b>{won.format(Math.round(result.assessedIncome))}만원</b><small>{result.incomeRule}</small></div>
          <p className="notice">실제 한도는 담보평가액, 스트레스 DSR, 중도금대출 승계·상환 방식, 금융사 내부심사와 시행 시점의 규정에 따라 달라질 수 있습니다.</p>
        </aside>
      </section>

      <section className="basis" id="basis">
        <div className="basis-head"><div><div className="eyebrow">계산 근거</div><h2>이번 대책에서 반영한 기준</h2></div><p>신축 입주단지 잔금대출은 총량관리 목표에서 별도 관리되지만, 개인별 LTV·DSR과 주택가격별 한도는 유지됩니다.</p></div>
        <div className="basis-grid">
          <article><b>01</b><h3>LTV</h3><p>규제지역 40%, 비규제지역 70%</p></article>
          <article><b>02</b><h3>DSR</h3><p>은행권 40%, 2금융권 50%</p></article>
          <article><b>03</b><h3>주담대 상한</h3><p>15억원 이하 6억원<br />15~25억원 4억원<br />25억원 초과 2억원</p></article>
          <article><b>04</b><h3>2027년 소득산정</h3><p>소득상승률 20% 초과 시 2년 평균, 30% 초과 시 3년 평균</p></article>
        </div>
      </section>

      <footer>본 서비스는 금융상품 권유가 아닌 사전 확인용 계산기입니다. 최종 대출 가능 여부는 취급 금융기관에 확인하세요.</footer>
    </main>
  );
}
