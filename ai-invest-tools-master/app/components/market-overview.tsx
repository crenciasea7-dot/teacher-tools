"use client";

import { useEffect, useState } from "react";

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
  quotes: QuoteItem[];
  asOf: string;
  refreshSeconds: number;
  delayedNotice: string;
};

type QuoteItem = {
  id: string;
  price: number;
  change: number;
  changePercent: number;
  format: "krw" | "usd" | "number" | "percent";
  precision: number;
  measuredAt: string;
  session: "정규장" | "시간외" | "24시간" | "해외시장";
  source: "CoinGecko" | "네이버 금융" | "Yahoo Finance";
  sourceUrl: string;
};

type InvestingInstrument = {
  id: string;
  name: string;
  symbol: string;
  url: string;
  statusNote?: string;
};

const INVESTING_GROUPS: Array<{ name: string; instruments: InvestingInstrument[] }> = [
  { name: "1. 주식", instruments: [
    { id: "sk-hynix", name: "SK하이닉스", symbol: "000660", url: "https://finance.naver.com/item/main.naver?code=000660" },
    { id: "samsung", name: "삼성전자", symbol: "005930", url: "https://finance.naver.com/item/main.naver?code=005930" },
  ] },
  { name: "2. 지수", instruments: [
    { id: "sp500", name: "S&P 500", symbol: "^GSPC", url: "https://finance.yahoo.com/quote/%5EGSPC/" },
    { id: "nasdaq", name: "NASDAQ", symbol: "^IXIC", url: "https://finance.yahoo.com/quote/%5EIXIC/" },
  ] },
  { name: "3. 금", instruments: [
    { id: "gold", name: "금", symbol: "GC=F", url: "https://finance.yahoo.com/quote/GC%3DF/" },
    { id: "kospi-night", name: "코스피 야간선물", symbol: "KOSPI 200 FUTURES", url: "https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd", statusNote: "정확한 실시간 제공처 연결 필요" },
  ] },
  { name: "4. 채권 & 금리", instruments: [
    { id: "us10y", name: "미국 10년물", symbol: "^TNX", url: "https://finance.yahoo.com/quote/%5ETNX/" },
    { id: "us30y", name: "미국 30년물", symbol: "^TYX", url: "https://finance.yahoo.com/quote/%5ETYX/" },
  ] },
  { name: "5. 상품 & 환율", instruments: [
    { id: "oil", name: "WTI 유가", symbol: "CL=F", url: "https://finance.yahoo.com/quote/CL%3DF/" },
    { id: "usd-krw", name: "원/달러", symbol: "USD/KRW", url: "https://finance.yahoo.com/quote/KRW%3DX/" },
  ] },
  { name: "6. 암호화폐", instruments: [
    { id: "btc", name: "비트코인", symbol: "BTC/USD", url: "https://www.coingecko.com/en/coins/bitcoin" },
    { id: "xrp", name: "리플", symbol: "XRP/USD", url: "https://www.coingecko.com/en/coins/xrp" },
  ] },
];

const ALERT_RULES: Record<string, { threshold: number; label: string }> = {
  us10y: { threshold: 4.5, label: "4.5% 이상" },
  us30y: { threshold: 5.3, label: "5.3% 이상" },
  oil: { threshold: 90, label: "$90 이상" },
  "usd-krw": { threshold: 1400, label: "1,400원 이상" },
};

function formatQuoteValue(value: number, quote: QuoteItem, change = false) {
  const sign = change ? (value > 0 ? "+" : value < 0 ? "−" : "") : "";
  const displayValue = change ? Math.abs(value) : value;
  const formatted = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: quote.precision,
    maximumFractionDigits: quote.precision,
  }).format(displayValue);
  if (quote.format === "krw") return `${sign}₩${formatted}`;
  if (quote.format === "usd") return `${sign}$${formatted}`;
  if (quote.format === "percent") return `${sign}${formatted}${change ? "%p" : "%"}`;
  return `${sign}${formatted}`;
}

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
  const needle = polar(180 - score * 1.8, 51);
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
      <svg className="sentiment-gauge" viewBox="0 0 240 160" role="meter" aria-label={`${title} ${item.score ?? "확인 중"}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.score ?? undefined}>
        {segments.map((segment) => <path d={arc(segment.start, segment.end)} stroke={segment.color} key={segment.start} />)}
        <text x="31" y="130">0</text><text x="116" y="24">50</text><text x="204" y="130">100</text>
        {item.available ? <><line className="gauge-needle" x1={centerX} y1={centerY} x2={needle.x} y2={needle.y} /><circle className="gauge-hub" cx={centerX} cy={centerY} r="7" /></> : null}
        <text className="gauge-score" x={centerX} y="154">{item.score ?? "—"}</text>
      </svg>
      <div className="sentiment-foot"><span>{item.note}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer" aria-label={`${title} 원본 자료 확인`}>원본 자료 확인 ↗</a></div>
    </article>
  );
}

function MarketLinkCard({ instrument, group, quote, loading }: { instrument: InvestingInstrument; group: string; quote?: QuoteItem; loading: boolean }) {
  const direction = quote ? (quote.changePercent > 0 ? "up" : quote.changePercent < 0 ? "down" : "flat") : "flat";
  const alertRule = ALERT_RULES[instrument.id];
  const alert = Boolean(quote && alertRule && quote.price >= alertRule.threshold);
  const quoteTime = quote
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date(quote.measuredAt))
    : null;
  return (
    <article className={`market-link-card ${alert ? "market-alert" : ""}`} aria-label={`${instrument.name} 현재가와 등락률`}>
      <span>{group.replace(/^\d+\.\s*/, "")}</span>
      <strong>{instrument.name}</strong>
      <small>{instrument.symbol}</small>
      {alert ? <div className="market-alert-badge">🔴 위험 기준 {alertRule.label}</div> : null}
      {quote ? <div className="market-api-quote">
        <strong>{formatQuoteValue(quote.price, quote)}</strong>
        <div className={direction}><em>{formatQuoteValue(quote.change, quote, true)}</em><b>{quote.changePercent > 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%</b></div>
        <small>{quote.source} · {quote.session} {quoteTime} · {quote.session === "24시간" ? "24시간 등락" : "전일 대비"}</small>
      </div> : <div className={`market-api-state ${loading && !instrument.statusNote ? "loading" : "unavailable"}`}>{instrument.statusNote ?? (loading ? "시세 불러오는 중…" : "시세 일시 확인 불가")}</div>}
      <div className="market-detail-link-row">
        <a href={quote?.sourceUrl ?? instrument.url} target="_blank" rel="noreferrer">{quote?.source ?? "원본 사이트"}에서 상세 보기 ↗</a>
      </div>
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
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [refreshKey]);

  const updatedAt = data?.asOf
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date(data.asOf))
    : null;

  return (
    <section className="market-overview" id="macro" aria-labelledby="market-overview-title">
      <div className="sentiment-section">
        <div className="sentiment-heading"><div><span>FEAR &amp; GREED INDEX</span><h2>오늘의 공포·탐욕지수</h2></div><p>미국·한국·암호화폐는 계산 기준이 달라 각각 따로 봅니다.</p></div>
        <div className="sentiment-grid">
          {data?.sentiment?.length ? data.sentiment.map((item) => <SentimentCard item={item} key={item.id} />) : Array.from({ length: 3 }, (_, index) => <div className="sentiment-skeleton" key={index} />)}
        </div>
      </div>

      <div className="market-heading">
        <div><span>PUBLIC MARKET DATA</span><h2 id="market-overview-title">Market Overview</h2><p>네이버 금융·Yahoo Finance·CoinGecko 시세를 서버에서 받아 현재가와 전일 대비 변화를 표시합니다.</p></div>
        <button type="button" onClick={() => setRefreshKey((key) => key + 1)} aria-label="시장 심리 데이터 새로고침">↻ {updatedAt ? `공탐 ${updatedAt} 기준` : "공탐 불러오는 중"}</button>
      </div>
      {error ? <p className="market-error">공포·탐욕지수를 불러오지 못했습니다. 잠시 후 자동으로 다시 시도합니다.</p> : null}

      <div className="market-quote-board" aria-label="핵심 시장 현재가 전체 보기">
        {INVESTING_GROUPS.flatMap((group) => group.instruments.map((instrument) => (
          <MarketLinkCard instrument={instrument} group={group.name} quote={data?.quotes?.find((quote) => quote.id === instrument.id)} loading={!data} key={instrument.id} />
        )))}
      </div>
      <div className="market-board-links">
        <a className="market-source-link" href="https://finance.naver.com/" target="_blank" rel="noreferrer">네이버 금융 ↗</a>
        <a className="market-source-link" href="https://finance.yahoo.com/markets/" target="_blank" rel="noreferrer">Yahoo Finance ↗</a>
        <a className="market-source-link" href="https://www.coingecko.com/" target="_blank" rel="noreferrer">CoinGecko ↗</a>
      </div>
      <p className="market-note">키 없이 제공되는 공개 시세 응답을 사용합니다. 제공처 정책과 시장 운영시간에 따라 일부 값이 지연되거나 일시적으로 표시되지 않을 수 있으며, 원본 링크는 계속 사용할 수 있습니다.</p>
    </section>
  );
}
