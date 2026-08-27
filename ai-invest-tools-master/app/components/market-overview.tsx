"use client";

import { useEffect, useState } from "react";

type MarketItem = {
  id: string;
  name: string;
  symbol: string;
  category: "암호화폐" | "주식" | "상품" | "채권" | "환율";
  format: "usd" | "krw" | "index" | "yield" | "fx";
  price: number | null;
  changePercent: number | null;
  marketTime: string | null;
  points: number[];
  available: boolean;
};

type MarketResponse = {
  items: MarketItem[];
  sentiment: SentimentItem[];
  asOf: string;
  refreshSeconds: number;
  delayedNotice: string;
};

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

const CATEGORY_ORDER: MarketItem["category"][] = ["암호화폐", "주식", "상품", "채권", "환율"];

function formatPrice(item: MarketItem) {
  if (item.price === null) return "확인 중";
  const options: Intl.NumberFormatOptions = item.format === "krw"
    ? { maximumFractionDigits: 0 }
    : item.id === "xrp"
      ? { minimumFractionDigits: 4, maximumFractionDigits: 4 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  const value = new Intl.NumberFormat("ko-KR", options).format(item.price);

  if (item.format === "usd") return `$${value}`;
  if (item.format === "krw" || item.format === "fx") return `₩${value}`;
  if (item.format === "yield") return `${value}%`;
  return value;
}

function Sparkline({ points, direction }: { points: number[]; direction: "up" | "down" | "flat" }) {
  if (points.length < 2) return <div className="spark-empty">—</div>;
  const width = 118;
  const height = 42;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = max - min || 1;
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((point - min) / spread) * (height - 6) - 3;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg className={`spark ${direction}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="당일 가격 미니차트">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarketTile({ item }: { item: MarketItem }) {
  const direction = item.changePercent === null || item.changePercent === 0
    ? "flat"
    : item.changePercent > 0 ? "up" : "down";
  const change = item.changePercent === null
    ? "—"
    : `${item.changePercent > 0 ? "+" : ""}${item.changePercent.toFixed(2)}%`;

  return (
    <article className={`market-tile ${item.available ? "" : "unavailable"}`}>
      <div className="market-name"><b>{item.name}</b><span>{item.symbol}</span></div>
      <div className="market-price"><strong>{formatPrice(item)}</strong><em className={direction}>{change}</em></div>
      <Sparkline points={item.points} direction={direction} />
    </article>
  );
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
        {item.available && <><line className="gauge-needle" x1={centerX} y1={centerY} x2={needle.x} y2={needle.y} /><circle className="gauge-hub" cx={centerX} cy={centerY} r="8" /></>}
        <text className="gauge-score" x={centerX} y="137">{item.score ?? "—"}</text>
      </svg>
      <div className="sentiment-foot"><span>{item.note}</span><a href={item.sourceUrl} target="_blank" rel="noreferrer">출처 ↗</a></div>
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
        if (!response.ok) throw new Error("Market data request failed");
        const nextData = (await response.json()) as MarketResponse;
        if (active) {
          setData(nextData);
          setError(false);
        }
      } catch (requestError) {
        if (active && !(requestError instanceof DOMException && requestError.name === "AbortError")) setError(true);
      }
    }

    void load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refreshKey]);

  const updatedAt = data?.asOf
    ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date(data.asOf))
    : null;

  return (
    <section className="market-overview" aria-labelledby="market-overview-title">
      <div className="sentiment-section">
        <div className="sentiment-heading"><div><span>FEAR &amp; GREED INDEX</span><h2>오늘의 공포·탐욕지수</h2></div><p>미국·한국·암호화폐는 계산 기준이 달라 각각 따로 봅니다.</p></div>
        <div className="sentiment-grid">
          {data?.sentiment?.length
            ? data.sentiment.map((item) => <SentimentCard item={item} key={item.id} />)
            : Array.from({ length: 3 }, (_, index) => <div className="sentiment-skeleton" key={index} />)}
        </div>
      </div>
      <div className="market-heading">
        <div><span>LIVE MARKET BOARD</span><h2 id="market-overview-title">Market Overview</h2><p>주요 자산의 현재 흐름을 한눈에 확인하세요.</p></div>
        <button type="button" onClick={() => setRefreshKey((key) => key + 1)} aria-label="시장 데이터 새로고침">↻ {updatedAt ? `${updatedAt} 기준` : "불러오는 중"}</button>
      </div>
      {error && <p className="market-error">일부 시세를 불러오지 못했습니다. 잠시 후 자동으로 다시 시도합니다.</p>}
      <div className="market-groups">
        {CATEGORY_ORDER.map((category) => {
          const items = data?.items.filter((item) => item.category === category) ?? [];
          return (
            <div className="market-group" key={category}>
              <h3>{category}</h3>
              <div className="market-grid">
                {items.length > 0
                  ? items.map((item) => <MarketTile item={item} key={item.id} />)
                  : Array.from({ length: category === "주식" ? 6 : 2 }, (_, index) => <div className="market-skeleton" key={index} />)}
              </div>
            </div>
          );
        })}
      </div>
      <p className="market-note">60초마다 자동 업데이트 · {data?.delayedNotice ?? "거래소와 데이터 제공처에 따라 시세가 지연될 수 있습니다."}</p>
    </section>
  );
}
