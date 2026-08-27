"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ai-invest-gold-v1";
const won = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

export default function GoldTracker() {
  const [grams, setGrams] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setGrams(data.grams ?? "");
      setBuyPrice(data.buyPrice ?? "");
      setCurrentPrice(data.currentPrice ?? "");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  const result = useMemo(() => { const quantity = Number(grams) || 0; const buy = Number(buyPrice) || 0; const current = Number(currentPrice) || 0; const invested = quantity * buy; const value = quantity * current; const profit = value - invested; return { invested, value, profit, rate: invested ? profit / invested * 100 : 0 }; }, [buyPrice, currentPrice, grams]);
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ grams, buyPrice, currentPrice })); setSaved(true); window.setTimeout(() => setSaved(false), 1800); }
  return <section className="gold-tracker"><header><div><span>GOLD TRACKER</span><h2>금(Gold) 손익 추적</h2></div><p>단위: 그램(g) · 이 브라우저에만 저장</p></header><div className="gold-inputs"><label>보유 수량<input type="number" min="0" step="0.01" value={grams} onChange={(event) => setGrams(event.target.value)} placeholder="100" /><span>g</span></label><label>그램당 매수가<input type="number" min="0" value={buyPrice} onChange={(event) => setBuyPrice(event.target.value)} placeholder="120000" /><span>원</span></label><label>그램당 현재가<input type="number" min="0" value={currentPrice} onChange={(event) => setCurrentPrice(event.target.value)} placeholder="135000" /><span>원</span></label><button type="button" onClick={save}>{saved ? "저장됨 ✓" : "이 기기에 저장"}</button></div><div className="gold-results"><div><span>총 매수금액</span><b>{won.format(result.invested)}원</b></div><div><span>현재 평가금액</span><b>{won.format(result.value)}원</b></div><div className={result.profit >= 0 ? "profit" : "loss"}><span>평가손익</span><b>{result.profit >= 0 ? "+" : ""}{won.format(result.profit)}원</b><small>{result.rate >= 0 ? "+" : ""}{result.rate.toFixed(2)}%</small></div></div></section>;
}
