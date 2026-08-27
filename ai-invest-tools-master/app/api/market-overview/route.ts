type MarketDefinition = {
  id: string;
  name: string;
  symbol: string;
  category: "암호화폐" | "주식" | "상품" | "채권" | "환율";
  format: "usd" | "krw" | "index" | "yield" | "fx";
};

const MARKETS: MarketDefinition[] = [
  { id: "btc", name: "BTC", symbol: "BTC-USD", category: "암호화폐", format: "usd" },
  { id: "xrp", name: "XRP", symbol: "XRP-USD", category: "암호화폐", format: "usd" },
  { id: "sk-hynix", name: "SK하이닉스", symbol: "000660.KS", category: "주식", format: "krw" },
  { id: "samsung", name: "삼성전자", symbol: "005930.KS", category: "주식", format: "krw" },
  { id: "sp500", name: "S&P 500", symbol: "^GSPC", category: "주식", format: "index" },
  { id: "nasdaq", name: "NASDAQ", symbol: "^IXIC", category: "주식", format: "index" },
  { id: "kospi", name: "코스피", symbol: "^KS11", category: "주식", format: "index" },
  { id: "kosdaq", name: "코스닥", symbol: "^KQ11", category: "주식", format: "index" },
  { id: "gold", name: "금 (GOLD)", symbol: "GC=F", category: "상품", format: "usd" },
  { id: "oil", name: "유가 (OIL)", symbol: "CL=F", category: "상품", format: "usd" },
  { id: "us10y", name: "미국 10년물", symbol: "^TNX", category: "채권", format: "yield" },
  { id: "us30y", name: "미국 30년물", symbol: "^TYX", category: "채권", format: "yield" },
  { id: "krw-usd", name: "KRW/USD", symbol: "KRW=X", category: "환율", format: "fx" },
];

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketTime?: number;
      };
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};

type FearGreedApi = {
  timestamp?: string;
  us?: { score?: number; label?: string };
  kr?: { score?: number; label?: string };
};

type CryptoFearGreedApi = {
  data?: Array<{ value?: string; value_classification?: string; timestamp?: string }>;
};

type SentimentItem = {
  id: "us" | "kr" | "crypto";
  market: string;
  detail: string;
  score: number | null;
  label: string;
  source: string;
  sourceUrl: string;
  measuredAt: string | null;
  available: boolean;
  note: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function chartUrlFor(symbol: string) {
  return `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/chart/`;
}

async function fetchMarket(definition: MarketDefinition) {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(definition.symbol)}`);
  url.searchParams.set("range", "1d");
  url.searchParams.set("interval", "5m");
  url.searchParams.set("includePrePost", "false");

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)" },
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`Quote request failed: ${response.status}`);

  const payload = (await response.json()) as YahooChart;
  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  const points = (result?.indicators?.quote?.[0]?.close ?? []).filter(isFiniteNumber).slice(-48);
  const price = isFiniteNumber(meta?.regularMarketPrice) ? meta.regularMarketPrice : points.at(-1);
  const previousClose = isFiniteNumber(meta?.chartPreviousClose)
    ? meta.chartPreviousClose
    : isFiniteNumber(meta?.previousClose)
      ? meta.previousClose
      : points.at(0);

  if (!isFiniteNumber(price)) throw new Error("Current price is unavailable");

  const changePercent = isFiniteNumber(previousClose) && previousClose !== 0
    ? ((price - previousClose) / previousClose) * 100
    : null;

  return {
    ...definition,
    chartUrl: chartUrlFor(definition.symbol),
    price,
    changePercent,
    currency: meta?.currency ?? null,
    marketTime: isFiniteNumber(meta?.regularMarketTime)
      ? new Date(meta.regularMarketTime * 1_000).toISOString()
      : null,
    points,
    available: true as const,
  };
}

function normalizeScore(value: unknown) {
  return isFiniteNumber(value) ? Math.max(0, Math.min(100, Math.round(value))) : null;
}

function translateCryptoLabel(label: string | undefined) {
  const labels: Record<string, string> = {
    "Extreme Fear": "극단적 공포",
    Fear: "공포",
    Neutral: "중립",
    Greed: "탐욕",
    "Extreme Greed": "극단적 탐욕",
  };
  return label ? (labels[label] ?? label) : "확인 중";
}

function unavailableSentiment(item: Omit<SentimentItem, "score" | "label" | "measuredAt" | "available">): SentimentItem {
  return { ...item, score: null, label: "확인 중", measuredAt: null, available: false };
}

async function fetchStockSentiments(): Promise<SentimentItem[]> {
  const response = await fetch("https://feargree-api.vercel.app/api", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Sentiment request failed: ${response.status}`);

  const payload = (await response.json()) as FearGreedApi;
  const usScore = normalizeScore(payload.us?.score);
  const krScore = normalizeScore(payload.kr?.score);

  return [
    { id: "us", market: "미국 주식", detail: "S&P 500 · NASDAQ", score: usScore, label: payload.us?.label ?? "확인 중", source: "CNN Fear & Greed", sourceUrl: "https://www.cnn.com/markets/fear-and-greed", measuredAt: payload.timestamp ?? null, available: usScore !== null, note: "CNN의 7개 미국 시장 지표" },
    { id: "kr", market: "한국 주식", detail: "KOSPI · KOSDAQ", score: krScore, label: payload.kr?.label ?? "확인 중", source: "Fear & Greed Index Korea", sourceUrl: "https://feargreed.co.kr/", measuredAt: payload.timestamp ?? null, available: krScore !== null, note: "한국 시장 6개 지표로 별도 산출" },
  ];
}

async function fetchCryptoSentiment(): Promise<SentimentItem> {
  const response = await fetch("https://api.alternative.me/fng/?limit=1&format=json", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Crypto sentiment request failed: ${response.status}`);

  const payload = (await response.json()) as CryptoFearGreedApi;
  const latest = payload.data?.[0];
  const parsed = latest?.value ? Number(latest.value) : null;
  const score = normalizeScore(parsed);
  const measuredAt = latest?.timestamp && Number.isFinite(Number(latest.timestamp)) ? new Date(Number(latest.timestamp) * 1_000).toISOString() : null;

  return { id: "crypto", market: "암호화폐", detail: "BTC 중심 시장심리", score, label: translateCryptoLabel(latest?.value_classification), source: "Alternative.me", sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/", measuredAt, available: score !== null, note: "변동성·거래량·소셜 데이터 등 종합" };
}

export async function GET() {
  const [settled, stockSentiments, cryptoSentiment] = await Promise.all([
    Promise.allSettled(MARKETS.map(fetchMarket)),
    fetchStockSentiments().catch(() => [
      unavailableSentiment({ id: "us", market: "미국 주식", detail: "S&P 500 · NASDAQ", source: "CNN Fear & Greed", sourceUrl: "https://www.cnn.com/markets/fear-and-greed", note: "CNN의 7개 미국 시장 지표" }),
      unavailableSentiment({ id: "kr", market: "한국 주식", detail: "KOSPI · KOSDAQ", source: "Fear & Greed Index Korea", sourceUrl: "https://feargreed.co.kr/", note: "한국 시장 6개 지표로 별도 산출" }),
    ]),
    fetchCryptoSentiment().catch(() => unavailableSentiment({ id: "crypto", market: "암호화폐", detail: "BTC 중심 시장심리", source: "Alternative.me", sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/", note: "변동성·거래량·소셜 데이터 등 종합" })),
  ]);
  const items = settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      ...MARKETS[index],
      chartUrl: chartUrlFor(MARKETS[index].symbol),
      price: null,
      changePercent: null,
      currency: null,
      marketTime: null,
      points: [],
      available: false as const,
    };
  });

  return Response.json(
    { items, sentiment: [...stockSentiments, cryptoSentiment], asOf: new Date().toISOString(), refreshSeconds: 60, delayedNotice: "거래소와 데이터 제공처에 따라 시세가 지연될 수 있습니다." },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
