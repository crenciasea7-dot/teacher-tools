"use client";

import Script from "next/script";
import { createElement, useEffect, useState } from "react";

type SentimentItem = {
  id: "us" | "kr" | "crypto";
  market: string;
  detail: string;
  score: number | null;
  label: string;
  source: string;
  sourceUrl: string;
  note: string;
  available: boolean;
};

type MarketResponse = {
  sentiment: SentimentItem[];
  asOf: string;
  refreshSeconds: number;
  delayedNotice: string;
};

type InvestingInstrument = {
  id: string;
  name: string;
  symbol: string;
  widgetSymbol: string;
  url: string;
};

const INVESTING_GROUPS: Array<{ name: string; instruments: InvestingInstrument[] }> = [
  { name: "1. 주식", instruments: [
    { id: "sk-hynix", name: "SK하이닉스", symbol: "000660", widgetSymbol: "KRX:000660", url: "https://www.tradingview.com/symbols/KRX-000660/" },
    { id: "samsung", name: "삼성전자", symbol: "005930", widgetSymbol: "KRX:005930", url: "https://www.tradingview.com/symbols/KRX-005930/" },
  ] },
  { name: "2. 지수", instruments: [
    { id: "sp500", name: "S&P 500", symbol: "SPX", widgetSymbol: "SP:SPX", url: "https://www.tradingview.com/symbols/SP-SPX/" },
    { id: "nasdaq", name: "NASDAQ", symbol: "IXIC", widgetSymbol: "NASDAQ:IXIC", url: "https://www.tradingview.com/symbols/NASDAQ-IXIC/" },
    { id: "kospi", name: "코스피", symbol: "KOSPI", widgetSymbol: "KRX:KOSPI", url: "https://www.tradingview.com/symbols/KRX-KOSPI/" },
    { id: "kosdaq", name: "코스닥", symbol: "KOSDAQ", widgetSymbol: "KRX:KOSDAQ", url: "https://www.tradingview.com/symbols/KRX-KOSDAQ/" },
  ] },
  { name: "3. 암호화폐", instruments: [
    { id: "btc", name: "비트코인", symbol: "BTC/USD", widgetSymbol: "BITSTAMP:BTCUSD", url: "https://www.tradingview.com/symbols/BTCUSD/" },
    { id: "xrp", name: "리플", symbol: "XRP/USD", widgetSymbol: "BITSTAMP:XRPUSD", url: "https://www.tradingview.com/symbols/XRPUSD/" },
  ] },
  { name: "4. 상품", instruments: [
    { id: "gold", name: "금", symbol: "XAU/USD", widgetSymbol: "OANDA:XAUUSD", url: "https://www.tradingview.com/symbols/XAUUSD/" },
    { id: "oil", name: "WTI 유가", symbol: "CL1!", widgetSymbol: "NYMEX:CL1!", url: "https://www.tradingview.com/symbols/NYMEX-CL1!/" },
  ] },
  { name: "5. 채권", instruments: [
    { id: "us10y", name: "미국 10년물", symbol: "US 10Y", widgetSymbol: "TVC:US10Y", url: "https://www.tradingview.com/symbols/TVC-US10Y/" },
    { id: "us30y", name: "미국 30년물", symbol: "US 30Y", widgetSymbol: "TVC:US30Y", url: "https://www.tradingview.com/symbols/TVC-US30Y/" },
  ] },
  { name: "6. 환율", instruments: [
    { id: "usd-krw", name: "원/달러", symbol: "USD/KRW", widgetSymbol: "FX_IDC:USDKRW", url: "https://www.tradingview.com/symbols/USDKRW/" },
  ] },
];

function SentimentCard({ item }: { item: SentimentItem }) {
  const score = item.score ?? 0;
  const tone = score < 25 ? "extreme-fear" : score < 45 ? "fear" : score < 56 ? "neutral" : score < 75 ? "greed" : "extreme-greed";
  const title = item.id === "us" ? "CNN 공탐지" : item.id === "kr" ? "코스피 공탐지" : "크립토 공탐지";
  const centerX = 120;
  const centerY = 116;
  const radius = 84;
  const polar = (angle: number, length = radius) => {
    const radians = angle * Math.PI / 180;
    return { x: centerX + length * Math.cos(radians), y: centerY - length * Math.sin(radians) };
  };
  const arc = (start: number, end: number) => {
    const from = polar(start);
    const to = polar(end);
    return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y}`;
  };
  const needle = polar(180 - score * 1.8, 66);
  const segments = [
    { start: 180, end: 145, color: "#ff5470" },
    { start: 143, end: 109, color: "#f08a65" },
    { start: 107, end: 73, color: "#f0c55f" },
    { start: 71, end: 37, color: "#57c99a" },
    { start: 35, end: 0, color: "#54c8db" },
  ];

  return (
    <article className={`sentiment-card ${tone} ${item.available ? "" : "unavailable"}`}>
      <div className="sentiment-title"><div><b>{title}</b><span>{item.detail}</span></div><em>{item.label}</em></div>
      <svg className="sentiment-gauge" viewBox="0 0 240 145" role="meter" aria-label={`${title} ${item.score ?? "확인 중"}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.score ?? undefined}>
        {segments.map((segment) => <path d={arc(segment.start, segment.end)} stroke={segment.color} key={segment.start} />)}
        <text x="31" y="130">0</text><text x="116" y="24">50</text><text x="204" y="130">100</text>
        {item.available ? <><line className="gauge-needle" x1={centerX} y1={centerY} x2={needle.x} y2={needle.y} /><circle className="gauge-hub" cx={centerX} cy={centerY} r="8" /></> : null}
        <text className="gauge-score" x={centerX} y="137">{item.score ?? "—"}</text>
      </svg>
      <div className="sentiment-foot"><span>{item.note}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${title} 원본 자료 확인`}>원본 자료 확인 ↗</a></div>
    </article>
  );
}

function MarketLinkCard({ instrument, group }: { instrument: InvestingInstrument; group: string }) {
  return (
    <article className="market-link-card" aria-label={`${instrument.name} 현재가와 등락률`}>
      <span>{group.replace(/^\d+\.\s*/, "")}</span>
      <strong>{instrument.name}</strong>
      <small>{instrument.symbol}</small>
      <div className="market-single-ticker">
        {createElement("tv-single-ticker", { symbol: instrument.widgetSymbol, locale: "kr", theme: "light", transparent: true, "symbol-url": instrument.url }, <span>시세 확인 중…</span>)}
      </div>
      <a href={instrument.url} target="_blank" rel="noreferrer">TradingView에서 상세 보기 ↗</a>
    </article>
  );
}

export default function MarketOverview() {
  const [data, setData] = useState<MarketResponse | null>(null);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/market-overview", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Market sentiment request failed");
        const nextData = (await response.json()) as MarketResponse;
        if (active) { setData(nextData); setError(false); }
      } catch (requestError) {
        if (active && !(requestError instanceof DOMException && requestError.name === "AbortError")) setError(true);
      }
    }
    void load();
    const timer = window.setInterval(load, 300_000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [refreshKey]);

  const updatedAt = data?.asOf
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date(data.asOf))
    : null;

  return (
    <section className="market-overview" id="macro" aria-labelledby="market-overview-title">
      <Script id="tradingview-single-ticker-widget" type="module" src="https://widgets.tradingview-widget.com/w/en/tv-single-ticker.js" strategy="afterInteractive" />
      <div className="sentiment-section">
        <div className="sentiment-heading"><div><span>FEAR &amp; GREED INDEX</span><h2>오늘의 공포·탐욕지수</h2></div><p>미국·한국·암호화폐는 계산 기준이 달라 각각 따로 봅니다.</p></div>
        <div className="sentiment-grid">
          {data?.sentiment?.length ? data.sentiment.map((item) => <SentimentCard item={item} key={item.id} />) : Array.from({ length: 3 }, (_, index) => <div className="sentiment-skeleton" key={index} />)}
        </div>
      </div>

      <div className="market-heading">
        <div><span>OFFICIAL SINGLE TICKER</span><h2 id="market-overview-title">Market Overview</h2><p>그래프 없이 현재가와 등락률만 간단히 표시하고, 원본 상세 페이지로 바로 연결합니다.</p></div>
        <button type="button" onClick={() => setRefreshKey((key) => key + 1)} aria-label="시장 심리 데이터 새로고침">↻ {updatedAt ? `공탐 ${updatedAt} 기준` : "공탐 불러오는 중"}</button>
      </div>
      {error ? <p className="market-error">공포·탐욕지수를 불러오지 못했습니다. 잠시 후 자동으로 다시 시도합니다.</p> : null}

      <div className="tradingview-market-board" aria-label="핵심 시장 현재가 전체 보기">
        {INVESTING_GROUPS.flatMap((group) => group.instruments.map((instrument) => (
          <MarketLinkCard instrument={instrument} group={group.name} key={instrument.id} />
        )))}
      </div>
      <div className="market-board-links">
        <a className="tradingview-all-markets" href="https://www.tradingview.com/markets/" target="_blank" rel="noreferrer">TradingView 전체 시장 보기 ↗</a>
      </div>
      <p className="market-note">TradingView 공식 Single Ticker 표시값입니다. 거래소 정책에 따라 일부 시세가 지연될 수 있으며, 카드를 불러오지 못해도 상세 링크는 계속 사용할 수 있습니다.</p>
    </section>
  );
}
