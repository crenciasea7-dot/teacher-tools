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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

export async function GET() {
  const settled = await Promise.allSettled(MARKETS.map(fetchMarket));
  const items = settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      ...MARKETS[index],
      price: null,
      changePercent: null,
      currency: null,
      marketTime: null,
      points: [],
      available: false as const,
    };
  });

  return Response.json(
    { items, asOf: new Date().toISOString(), refreshSeconds: 60, delayedNotice: "거래소와 데이터 제공처에 따라 시세가 지연될 수 있습니다." },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
