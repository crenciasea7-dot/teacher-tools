"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Form = { cash: number; income: number; rate: number; years: number; homes: "무주택" | "1주택" | "2주택 이상"; existing: number; regulated: boolean };
const initial: Form = { cash: 200000000, income: 60000000, rate: 4.5, years: 30, homes: "1주택", existing: 0, regulated: false };
const korean = (number: number) => { const eok = Math.floor(number / 100000000); const man = Math.round((number % 100000000) / 10000); return eok ? `${eok}억 ${man.toLocaleString()}만원` : `${man.toLocaleString()}만원`; };
const short = (number: number) => number >= 100000000 ? `≈ ${(number / 100000000).toFixed(1).replace(/\.0$/, "")}억원` : `≈ ${Math.round(number / 10000).toLocaleString()}만원`;

export default function Home() {
  const [form, setForm] = useState<Form>(initial);
  const numberChange = (key: keyof Pick<Form, "cash" | "income" | "rate" | "years" | "existing">) => (event: ChangeEvent<HTMLInputElement>) => setForm((old) => ({ ...old, [key]: Number(event.target.value.replaceAll(",", "")) || 0 }));
  const result = useMemo(() => {
    const dsr = form.homes === "2주택 이상" ? 0.4 : 0.4;
    const stressRate = form.rate + 1.5;
    const annualRoom = Math.max(0, form.income * dsr - form.existing);
    const monthlyRate = stressRate / 100 / 12;
    const months = Math.max(1, form.years * 12);
    const monthlyRoom = annualRoom / 12;
    const loanDsr = monthlyRate === 0 ? monthlyRoom * months : monthlyRoom * ((1 + monthlyRate) ** months - 1) / (monthlyRate * (1 + monthlyRate) ** months);
    const ltv = form.homes === "2주택 이상" ? (form.regulated ? 0.3 : 0.4) : (form.regulated ? 0.5 : 0.7);
    const feeRate = 0.021;
    const priceByCashAndLoan = (form.cash + loanDsr) / (1 + feeRate);
    const priceByLtv = form.cash / Math.max(0.01, 1 - ltv + feeRate);
    const price = Math.max(0, Math.min(priceByCashAndLoan, priceByLtv));
    const loan = Math.min(loanDsr, price * ltv);
    const fees = price * feeRate;
    return { price, loan, fees, ltv, stressRate, dsr };
  }, [form]);
  return <main>
    <header><div className="mark">P</div><div><b>구매력 계산기</b><span>Purchasing Power Estimator</span></div></header>
    <section className="layout"><div className="input-panel"><p className="eyebrow">REVERSE CALCULATION</p><h1>역계산 <em>(구매력)</em></h1><p className="subtitle">자기자금·연소득으로 살 수 있는 최대 매매가를 산출합니다.</p>
      <div className="fields"><Money label="자기자금 (원)" value={form.cash} hint={short(form.cash)} onChange={numberChange("cash")} /><Money label="연소득 (원)" value={form.income} hint={short(form.income)} onChange={numberChange("income")} />
        <NumberField label="금리 (%)" value={form.rate} step="0.1" onChange={numberChange("rate")} /><NumberField label="상환기간 (년)" value={form.years} onChange={numberChange("years")} />
        <label className="field"><span>주택 수</span><select value={form.homes} onChange={(event) => setForm((old) => ({ ...old, homes: event.target.value as Form["homes"] }))}><option>무주택</option><option>1주택</option><option>2주택 이상</option></select></label>
        <Money label="기존 대출 연 상환액 (원)" value={form.existing} hint={short(form.existing)} onChange={numberChange("existing")} />
      </div>
      <label className="check"><input type="checkbox" checked={form.regulated} onChange={(event) => setForm((old) => ({ ...old, regulated: event.target.checked }))} /> <span>조정대상지역</span></label>
      <p className="live"><i /> 입력값이 바뀔 때마다 결과가 실시간으로 업데이트됩니다</p>
    </div>
    <aside className="result-panel"><p>최대 매입 가능 매매가</p><strong>{korean(result.price)}</strong><span>부대비용 포함, 자기자금·DSR·LTV 한도 내 최대값 (근사 추정치)</span><div className="results"><Result icon="🏦" title="활용 가능 대출액" value={korean(result.loan)} /><Result icon="💰" title="예상 부대비용" value={korean(result.fees)} /><Result icon="📐" title="적용 LTV 한도" value={`${Math.round(result.ltv * 100)}%`} /><Result icon="📊" title="적용 DSR 한도" value={`${Math.round(result.dsr * 100)}% (심사금리 ${result.stressRate.toFixed(2)}%)`} /></div></aside></section>
    <footer>안내: 이 계산기는 일반적인 국내 주택담보대출 LTV·DSR 규정을 단순화하여 근사 추정한 참고용 도구입니다. 실제 대출 가능 금액·한도·세율은 은행, 상품, 지역, 개인 신용도 및 정책 변경에 따라 달라질 수 있으므로 금융기관 상담을 통해 확인하세요.</footer>
  </main>;
}
function Money({ label, value, hint, onChange }: { label: string; value: number; hint: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) { return <label className="field"><span>{label}</span><input type="text" inputMode="numeric" value={value.toLocaleString()} onChange={onChange} /><small>{hint}</small></label>; }
function NumberField({ label, value, step = "1", onChange }: { label: string; value: number; step?: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) { return <label className="field"><span>{label}</span><input type="number" min="0" step={step} value={value} onChange={onChange} /></label>; }
function Result({ icon, title, value }: { icon: string; title: string; value: string }) { return <article><span>{icon}</span><div><p>{title}</p><b>{value}</b></div></article>; }
