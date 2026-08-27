"use client";

import { ChangeEvent, useMemo, useState } from "react";
import "../tool-pages.css";

type Form = {
  price: number;
  paid: number;
  region: "비규제지역" | "규제지역";
  lender: "은행권" | "2금융권";
  income1: number;
  income2: number;
  income3: number;
  existing: number;
  rate: number;
  years: number;
};

const initial: Form = { price: 90000, paid: 36000, region: "비규제지역", lender: "은행권", income1: 7000, income2: 6200, income3: 5800, existing: 600, rate: 4.5, years: 30 };
const formatWon = (amount: number) => `${(amount / 10000).toFixed(1).replace(/\.0$/, "")}억원`;

export default function JipJangeumCalculatorPage() {
  const [form, setForm] = useState<Form>(initial);
  const onNumber = (key: keyof Form) => (event: ChangeEvent<HTMLInputElement>) => setForm((old) => ({ ...old, [key]: Number(event.target.value) || 0 }));
  const onSelect = (key: "region" | "lender") => (event: ChangeEvent<HTMLSelectElement>) => setForm((old) => ({ ...old, [key]: event.target.value as Form[typeof key] }));

  const result = useMemo(() => {
    const recognizedIncome = Math.max(form.income1, form.income2, form.income3);
    const dsrRatio = form.lender === "은행권" ? 0.4 : 0.5;
    const annualBudget = Math.max(0, recognizedIncome * dsrRatio - form.existing);
    const months = Math.max(1, form.years * 12);
    const monthlyRate = form.rate / 100 / 12;
    const monthlyPayment = annualBudget / 12;
    const dsrLimit = monthlyRate === 0 ? monthlyPayment * months : monthlyPayment * ((1 + monthlyRate) ** months - 1) / (monthlyRate * (1 + monthlyRate) ** months);
    const ltvRatio = form.region === "규제지역" ? 0.4 : 0.7;
    const remaining = Math.max(0, form.price - form.paid);
    const ltvLimit = Math.min(form.price * ltvRatio, remaining);
    const limit = Math.max(0, Math.min(dsrLimit, ltvLimit));
    return { recognizedIncome, annualBudget, dsrLimit, ltvLimit, remaining, limit, criterion: dsrLimit <= ltvLimit ? "DSR" : "LTV·잔금" };
  }, [form]);

  return (
    <main className="public-tool-page balance-tool">
      <a className="tool-back" href="/">← AI 투자 도구 MASTER</a>
      <section className="tool-intro centered"><p>JIP JANGEUM CALCULATOR</p><h1>집 잔금 계산기</h1><span>로그인 없이 내 조건을 넣고 예상 잔금대출 범위를 확인하세요.</span></section>
      <section className="tool-calculator">
        <div className="tool-form-panel">
          <h2>내 조건 입력</h2>
          <div className="tool-fields">
            <Field label="분양가" suffix="만원" value={form.price} onChange={onNumber("price")} />
            <Field label="납부 완료액" suffix="만원" value={form.paid} onChange={onNumber("paid")} />
            <Select label="입주지역" value={form.region} onChange={onSelect("region")} options={["비규제지역", "규제지역"]} />
            <Select label="대출기관" value={form.lender} onChange={onSelect("lender")} options={["은행권", "2금융권"]} />
          </div>
          <h3>최근 소득과 기존 대출</h3>
          <div className="tool-fields three">
            <Field label="최근 1년 소득" suffix="만원" value={form.income1} onChange={onNumber("income1")} />
            <Field label="2년 전 소득" suffix="만원" value={form.income2} onChange={onNumber("income2")} />
            <Field label="3년 전 소득" suffix="만원" value={form.income3} onChange={onNumber("income3")} />
          </div>
          <div className="tool-fields spaced"><Field label="기존 대출 연 원리금" suffix="만원" value={form.existing} onChange={onNumber("existing")} /></div>
          <h3>예상 대출 조건</h3>
          <div className="tool-fields">
            <Field label="예상 금리" suffix="%" step="0.1" value={form.rate} onChange={onNumber("rate")} />
            <Field label="상환기간" suffix="년" value={form.years} onChange={onNumber("years")} />
          </div>
        </div>
        <aside className="tool-result-panel">
          <p>예상 가능 잔금대출</p><strong>{formatWon(result.limit)}</strong>
          <span>한도 결정 기준: <b>{result.criterion}</b> · 인정소득 {result.recognizedIncome.toLocaleString()}만원</span>
          <div className="result-list">
            <div><span>남은 잔금</span><b>{formatWon(result.remaining)}</b></div>
            <div><span>DSR 기준 한도</span><b>{formatWon(result.dsrLimit)}</b></div>
            <div><span>LTV·잔금 기준</span><b>{formatWon(result.ltvLimit)}</b></div>
            <div><span>연간 원리금 여유</span><b>{Math.round(result.annualBudget).toLocaleString()}만원</b></div>
          </div>
          <small>실제 한도는 담보평가액, 스트레스 DSR, 금융회사 심사 및 시행 시점 규정에 따라 달라질 수 있습니다.</small>
        </aside>
      </section>
      <p className="tool-disclaimer">본 결과는 금융상품 권유가 아닌 사전 참고용 계산입니다.</p>
    </main>
  );
}

function Field({ label, suffix, value, onChange, step = "1" }: { label: string; suffix: string; value: number; onChange: (event: ChangeEvent<HTMLInputElement>) => void; step?: string }) {
  return <label className="tool-field"><span>{label}</span><div><input type="number" min="0" step={step} value={value} onChange={onChange} /><em>{suffix}</em></div></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (event: ChangeEvent<HTMLSelectElement>) => void; options: string[] }) {
  return <label className="tool-field"><span>{label}</span><div><select value={value} onChange={onChange}>{options.map((option) => <option key={option}>{option}</option>)}</select></div></label>;
}
