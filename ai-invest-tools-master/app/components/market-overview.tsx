"use client";

import { useEffect, useMemo, useState } from "react";

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
  pairId: number;
  url: string;
};

const INVESTING_GROUPS: Array<{ name: string; instruments: InvestingInstrument[] }> = [
  { name: "1. 주식", instruments: [
    { id: "sk-hynix", name: "SK하이닉스", symbol: "000660", pairId: 43430, url: "https://kr.investing.com/equities/sk-hynix-inc" },
    { id: "samsung", name: "삼성전자", symbol: "005930", pairId: 43433, url: "https://kr.investing.com/equities/samsung-electronics-co-ltd" },
  ] },
  { name: "2. 지수", instruments: [
    { id: "sp500", name: "S&P 500", symbol: "SPX", pairId: 166, url: "https://kr.investing.com/indices/us-spx-500" },
    { id: "nasdaq", name: "NASDAQ", symbol: "IXIC", pairId: 14958, url: "https://kr.investing.com/indices/nasdaq-composite" },
    { id: "kospi", name: "코스피", symbol: "KOSPI", pairId: 37426, url: "https://kr.investing.com/indices/kospi" },
    { id: "kosdaq", name: "코스닥", symbol: "KOSDAQ", pairId: 38016, url: "https://kr.investing.com/indices/kosdaq" },
  ] },
  { name: "3. 암호화폐", instruments: [
    { id: "btc", name: "비트코인", symbol: "BTC/USD", pairId: 945629, url: "https://kr.investing.com/crypto/bitcoin/btc-usd" },
    { id: "xrp", name: "리플", symbol: "XRP/USD", pairId: 1118146, url: "https://kr.investing.com/crypto/xrp/xrp-usd" },
  ] },
  { name: "4. 상품", instruments: [
    { id: "gold", name: "금", symbol: "GOLD", pairId: 8830, url: "https://kr.investing.com/commodities/gold" },
    { id: "oil", name: "WTI 유가", symbol: "OIL", pairId: 8849, url: "https://kr.investing.com/commodities/crude-oil" },
  ] },
  { name: "5. 채권", instruments: [
    { id: "us10y", name: "미국 10년물", symbol: "US 10Y", pairId: 23705, url: "https://kr.investing.com/rates-bonds/u.s.-10-year-bond-yield" },
    { id: "us30y", name: "미국 30년물", symbol: "US 30Y", pairId: 23706, url: "https://kr.investing.com/rates-bonds/u.s.-30-year-bond-yield" },
  ] },
  { name: "6. 환율", instruments: [
    { id: "usd-krw", name: "원/달러", symbol: "USD/KRW", pairId: 650, url: "https://kr.investing.com/currencies/usd-krw" },
  ] },
];

const INVESTING_INSTRUMENTS = INVESTING_GROUPS.flatMap((group) => group.instruments);

function investingWidgetUrl(pairId: number) {
  const params = new URLSearchParams({ pair_ID: String(pairId), height: "480", width: "650", interval: "300", plotStyle: "area", domain_ID: "18", lang_ID: "18", timezone_ID: "26" });
  return `https://ssltvc.investing.com/?${params.toString()}`;
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
      <div className="sentiment-foot"><span>{item.note}</span><b>실시간 지수</b></div>
    </article>
  );
}

export default function MarketOverview() {
  const [data, setData] = useState<MarketResponse | null>(null);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState("kospi");

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

  const selected = useMemo(
    () => INVESTING_INSTRUMENTS.find((instrument) => instrument.id === selectedId) ?? INVESTING_INSTRUMENTS[0],
    [selectedId],
  );
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
        <div><span>INVESTING.COM OFFICIAL WIDGET</span><h2 id="market-overview-title">Market Overview</h2><p>Yahoo 시세를 제거하고 Investing.com 공식 차트로 교체했습니다.</p></div>
        <button type="button" onClick={() => setRefreshKey((key) => key + 1)} aria-label="시장 심리 데이터 새로고침">↻ {updatedAt ? `${updatedAt} 기준` : "불러오는 중"}</button>
      </div>
      {error ? <p className="market-error">공포·탐욕지수를 불러오지 못했습니다. 잠시 후 자동으로 다시 시도합니다.</p> : null}

      <div className="investing-market-layout">
        <div className="investing-instrument-groups" aria-label="시장 종목 선택">
          {INVESTING_GROUPS.map((group) => (
            <section className="investing-instrument-group" key={group.name}>
              <h3>{group.name}</h3>
              <div className="investing-instrument-buttons">
                {group.instruments.map((instrument) => (
                  <button type="button" className={selected.id === instrument.id ? "active" : ""} onClick={() => setSelectedId(instrument.id)} aria-pressed={selected.id === instrument.id} key={instrument.id}>
                    <b>{instrument.name}</b><span>{instrument.symbol}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <a className="bitcoin-indicator-entry" href="/bitcoin-indicators"><span>₿</span><div><b>비트코인 참고 지표</b><small>공탐·레인보우·도미넌스 보기</small></div><em>→</em></a>
        </div>

        <article className="investing-official-chart">
          <header><div><span>INVESTING.COM</span><h3>{selected.name} <small>{selected.symbol}</small></h3></div><a href={selected.url} target="_blank" rel="noreferrer">인베스팅닷컴에서 자세히 보기 ↗</a></header>
          <iframe key={selected.id} src={investingWidgetUrl(selected.pairId)} title={`${selected.name} Investing.com 공식 차트`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </article>
      </div>
      <p className="market-note">종목을 누르면 공식 차트가 바뀝니다. · {data?.delayedNotice ?? "거래소 정책에 따라 일부 시세가 지연될 수 있습니다."}</p>
    </section>
  );
}
