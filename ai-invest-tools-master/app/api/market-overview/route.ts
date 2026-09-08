type FearGreedApi = {
  timestamp?: string;
  us?: { score?: number; label?: string };
  kr?: { score?: number; label?: string };
};

type CryptoFearGreedApi = {
  data?: Array<{ value?: string; value_classification?: string; timestamp?: string }>;
};

type CoinGeckoPriceApi = Record<string, { usd?: number; usd_24h_change?: number; last_updated_at?: number }>;

type QuoteId = "sk-hynix" | "samsung" | "micron" | "sandisk" | "sp500" | "nasdaq" | "kospi" | "kosdaq" | "btc" | "xrp" | "gold" | "oil" | "us10y" | "us30y" | "usd-krw";
type QuoteFormat = "krw" | "usd" | "number" | "percent";

type QuoteItem = {
  id: QuoteId;
  price: number;
  change: number;
  changePercent: number;
  format: QuoteFormat;
  precision: number;
  measuredAt: string;
  session: "정규장" | "시간외" | "24시간" | "해외시장";
  source: "CoinGecko" | "네이버 금융" | "Yahoo Finance";
  sourceUrl: string;
  sparkline?: number[];
  sparklineTimes?: number[];
  chartSession?: { start: number; end: number };
  marketStatus?: "장중" | "장중 · 시세 지연" | "장마감" | "시간외 거래 중" | "시간외 거래 중 · 시세 지연" | "24시간 거래" | "24시간 거래 · 시세 지연" | "장 상태 확인 중";
};

type NaverRealtimeItem = {
  marketStatus?: string;
  nv?: string | number;
  cv?: string | number;
  cr?: string | number;
  rf?: string;
  closePrice?: string;
  closePriceRaw?: string;
  compareToPreviousClosePrice?: string;
  compareToPreviousClosePriceRaw?: string;
  fluctuationsRatio?: string;
  fluctuationsRatioRaw?: string;
  localTradedAt?: string;
  compareToPreviousPrice?: { code?: string; name?: string };
  overMarketPriceInfo?: {
    overMarketStatus?: string;
    overPrice?: string;
    compareToPreviousClosePrice?: string;
    fluctuationsRatio?: string;
    localTradedAt?: string;
    compareToPreviousPrice?: { code?: string; name?: string };
  };
};

type NaverRealtimeApi = {
  datas?: NaverRealtimeItem[];
  result?: { areas?: Array<{ datas?: NaverRealtimeItem[] }> };
};

type YahooChartApi = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        regularMarketTime?: number;
        previousClose?: number;
        regularMarketPreviousClose?: number;
        chartPreviousClose?: number;
        currentTradingPeriod?: { regular?: { start?: number; end?: number } };
        tradingPeriods?: Array<Array<{ start: number; end: number }>>;
      };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
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

function normalizeScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : null;
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

function parseMarketNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function signedMarketNumber(value: number, direction: string | undefined) {
  if (value < 0) return value;
  if (direction === "5" || direction === "FALLING") return -Math.abs(value);
  if (direction === "2" || direction === "RISING") return Math.abs(value);
  return value;
}

function tradingStatus(kind: "장중" | "시간외 거래 중" | "24시간 거래", measuredAt: number): QuoteItem["marketStatus"] {
  return !Number.isFinite(measuredAt) || Date.now() - measuredAt > 120_000 ? `${kind} · 시세 지연` : kind;
}

async function fetchCryptoQuotes(): Promise<QuoteItem[]> {
  const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin%2Cripple&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true", {
    headers: { "User-Agent": "AI-Invest-Tools/1.0" },
    next: { revalidate: 15 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`CoinGecko quote request failed: ${response.status}`);
  const payload = (await response.json()) as CoinGeckoPriceApi;
  const definitions = [
    { id: "btc" as const, key: "bitcoin", sourceUrl: "https://www.coingecko.com/en/coins/bitcoin" },
    { id: "xrp" as const, key: "ripple", sourceUrl: "https://www.coingecko.com/en/coins/xrp" },
  ];
  return definitions.flatMap((definition) => {
    const item = payload[definition.key];
    if (!item || typeof item.usd !== "number" || typeof item.usd_24h_change !== "number") return [];
    const previousPrice = item.usd / (1 + item.usd_24h_change / 100);
    return [{
      id: definition.id,
      price: item.usd,
      change: Number.isFinite(previousPrice) ? item.usd - previousPrice : 0,
      changePercent: item.usd_24h_change,
      format: "usd" as const,
      precision: item.usd < 10 ? 4 : 0,
      measuredAt: new Date((item.last_updated_at ?? Math.floor(Date.now() / 1_000)) * 1_000).toISOString(),
      session: "24시간" as const,
      marketStatus: tradingStatus("24시간 거래", (item.last_updated_at ?? 0) * 1_000),
      source: "CoinGecko" as const,
      sourceUrl: definition.sourceUrl,
    }];
  });
}

async function fetchNaverQuotes(): Promise<QuoteItem[]> {
  const definitions = [
    { id: "sk-hynix" as const, kind: "stock", code: "000660", format: "krw" as const, precision: 0, sourceUrl: "https://finance.naver.com/item/main.naver?code=000660" },
    { id: "samsung" as const, kind: "stock", code: "005930", format: "krw" as const, precision: 0, sourceUrl: "https://finance.naver.com/item/main.naver?code=005930" },
    { id: "kospi" as const, kind: "index", code: "KOSPI", format: "number" as const, precision: 2, sourceUrl: "https://finance.naver.com/sise/sise_index.naver?code=KOSPI" },
    { id: "kosdaq" as const, kind: "index", code: "KOSDAQ", format: "number" as const, precision: 2, sourceUrl: "https://finance.naver.com/sise/sise_index.naver?code=KOSDAQ" },
  ];

  const quotes = await Promise.all(definitions.map(async (definition): Promise<QuoteItem | null> => {
    try {
      const response = await fetch(`https://polling.finance.naver.com/api/realtime/domestic/${definition.kind}/${definition.code}`, {
        headers: {
          Referer: "https://finance.naver.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
        next: { revalidate: 15 },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`Naver quote request failed: ${response.status}`);
      const payload = (await response.json()) as NaverRealtimeApi;
      const item = payload.datas?.[0] ?? payload.result?.areas?.[0]?.datas?.[0];
      if (!item) return null;

      const afterMarket = item.overMarketPriceInfo?.overMarketStatus === "OPEN" ? item.overMarketPriceInfo : null;
      const price = parseMarketNumber(afterMarket?.overPrice ?? item.closePriceRaw ?? item.closePrice ?? item.nv);
      const rawChange = parseMarketNumber(afterMarket?.compareToPreviousClosePrice ?? item.compareToPreviousClosePriceRaw ?? item.compareToPreviousClosePrice ?? item.cv);
      const rawChangePercent = parseMarketNumber(afterMarket?.fluctuationsRatio ?? item.fluctuationsRatioRaw ?? item.fluctuationsRatio ?? item.cr);
      const direction = afterMarket?.compareToPreviousPrice?.code ?? afterMarket?.compareToPreviousPrice?.name ?? item.compareToPreviousPrice?.code ?? item.compareToPreviousPrice?.name ?? item.rf;
      if (price === null || rawChange === null || rawChangePercent === null) return null;
      const measuredAt = new Date(afterMarket?.localTradedAt ?? item.localTradedAt ?? 0).getTime();
      const marketStatus = afterMarket ? tradingStatus("시간외 거래 중", measuredAt)
        : item.marketStatus === "OPEN" ? tradingStatus("장중", measuredAt)
        : item.marketStatus === "CLOSE" ? "장마감" : "장 상태 확인 중";

      return {
        id: definition.id,
        price,
        change: signedMarketNumber(rawChange, direction),
        changePercent: signedMarketNumber(rawChangePercent, direction),
        format: definition.format,
        precision: definition.precision,
        measuredAt: new Date(afterMarket?.localTradedAt ?? item.localTradedAt ?? Date.now()).toISOString(),
        session: afterMarket ? "시간외" : "정규장",
        marketStatus,
        source: "네이버 금융",
        sourceUrl: definition.sourceUrl,
      };
    } catch (error) {
      console.error("[market-overview][naver] quote failed", {
        id: definition.id,
        code: definition.code,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }));

  return quotes.filter((quote): quote is QuoteItem => quote !== null);
}

async function fetchYahooQuotes(): Promise<QuoteItem[]> {
  const definitions = [
    { id: "micron" as const, ticker: "MU", format: "usd" as const, precision: 2 },
    { id: "sandisk" as const, ticker: "SNDK", format: "usd" as const, precision: 2 },
    { id: "sp500" as const, ticker: "^GSPC", format: "number" as const, precision: 2 },
    { id: "nasdaq" as const, ticker: "^IXIC", format: "number" as const, precision: 2 },
    { id: "gold" as const, ticker: "GC=F", format: "usd" as const, precision: 2 },
    { id: "oil" as const, ticker: "CL=F", format: "usd" as const, precision: 2 },
    { id: "us10y" as const, ticker: "^TNX", format: "percent" as const, precision: 3 },
    { id: "us30y" as const, ticker: "^TYX", format: "percent" as const, precision: 3 },
    { id: "usd-krw" as const, ticker: "KRW=X", format: "krw" as const, precision: 2 },
  ];

  const quotes = await Promise.all(definitions.map(async (definition): Promise<QuoteItem | null> => {
    try {
      const ticker = encodeURIComponent(definition.ticker);
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)", Accept: "application/json" },
        next: { revalidate: 15 },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`Yahoo quote request failed: ${response.status}`);
      const payload = (await response.json()) as YahooChartApi;
      const meta = payload.chart?.result?.[0]?.meta;
      let price = meta?.regularMarketPrice;
      let previousClose = meta?.previousClose ?? meta?.chartPreviousClose ?? meta?.regularMarketPreviousClose;
      if (typeof price !== "number" || typeof previousClose !== "number" || !Number.isFinite(price) || !Number.isFinite(previousClose) || previousClose === 0) return null;

      if (definition.format === "percent" && price > 20) {
        price /= 10;
        previousClose /= 10;
      }
      const change = price - previousClose;
      const now = Math.floor(Date.now() / 1_000);
      const period = meta?.currentTradingPeriod?.regular;
      const hasPeriod = typeof period?.start === "number" && typeof period?.end === "number" && period.end > period.start;
      const isOpen = hasPeriod && now >= period.start! && now < period.end!;
      const marketStatus = !hasPeriod ? "장 상태 확인 중" : isOpen ? tradingStatus("장중", (meta?.regularMarketTime ?? 0) * 1_000) : "장마감";

      return {
        id: definition.id,
        price,
        change,
        changePercent: change / previousClose * 100,
        format: definition.format,
        precision: definition.precision,
        measuredAt: new Date((meta?.regularMarketTime ?? Math.floor(Date.now() / 1_000)) * 1_000).toISOString(),
        session: "해외시장",
        source: "Yahoo Finance",
        marketStatus,
        sourceUrl: `https://finance.yahoo.com/quote/${ticker}/`,
      };
    } catch (error) {
      console.error("[market-overview][yahoo] quote failed", {
        id: definition.id,
        ticker: definition.ticker,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }));

  return quotes.filter((quote): quote is QuoteItem => quote !== null);
}

async function fetchMarketSparklines() {
  const definitions: Array<{ id: QuoteId; ticker: string }> = [
    { id: "sk-hynix", ticker: "000660.KS" },
    { id: "samsung", ticker: "005930.KS" },
    { id: "micron", ticker: "MU" },
    { id: "sandisk", ticker: "SNDK" },
    { id: "kospi", ticker: "^KS11" },
    { id: "kosdaq", ticker: "^KQ11" },
    { id: "sp500", ticker: "^GSPC" },
    { id: "nasdaq", ticker: "^IXIC" },
    { id: "gold", ticker: "GC=F" },
    { id: "us10y", ticker: "^TNX" },
    { id: "us30y", ticker: "^TYX" },
    { id: "oil", ticker: "CL=F" },
    { id: "usd-krw", ticker: "KRW=X" },
    { id: "btc", ticker: "BTC-USD" },
    { id: "xrp", ticker: "XRP-USD" },
  ];

  type ChartData = Pick<QuoteItem, "sparkline" | "sparklineTimes" | "chartSession">;
  const series = await Promise.all(definitions.map(async ({ id, ticker }): Promise<[QuoteId, ChartData]> => {
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)", Accept: "application/json" },
        next: { revalidate: 15 },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) return [id, {}];
      const payload = (await response.json()) as YahooChartApi;
      const chart = payload.chart?.result?.[0];
      const closes = chart?.indicators?.quote?.[0]?.close ?? [];
      const points = (chart?.timestamp ?? []).flatMap((time, index) => {
        const value = closes[index];
        return Number.isFinite(time) && typeof value === "number" && Number.isFinite(value) ? [{ time, value }] : [];
      });
      const lastTime = points.at(-1)?.time;
      const periods = chart?.meta?.tradingPeriods?.flat() ?? [];
      const current = chart?.meta?.currentTradingPeriod?.regular;
      if (typeof current?.start === "number" && typeof current?.end === "number") periods.push({ start: current.start, end: current.end });
      const chartSession = periods.find((period) => Number.isFinite(period.start) && Number.isFinite(period.end) && period.end > period.start && lastTime !== undefined && lastTime >= period.start && lastTime <= period.end);
      if (!chartSession) return [id, {}];
      const sessionPoints = points.filter(({ time }) => time >= chartSession.start && time <= chartSession.end);
      return [id, { sparkline: sessionPoints.map(({ value }) => value), sparklineTimes: sessionPoints.map(({ time }) => time), chartSession }];
    } catch {
      return [id, {}];
    }
  }));

  return new Map<QuoteId, ChartData>(series);
}

export async function GET() {
  const [stockSentiments, cryptoSentiment, cryptoQuotes, naverQuotes, yahooQuotes, sparklines] = await Promise.all([
    fetchStockSentiments().catch(() => [
      unavailableSentiment({ id: "us", market: "미국 주식", detail: "S&P 500 · NASDAQ", source: "CNN Fear & Greed", sourceUrl: "https://www.cnn.com/markets/fear-and-greed", note: "CNN의 7개 미국 시장 지표" }),
      unavailableSentiment({ id: "kr", market: "한국 주식", detail: "KOSPI · KOSDAQ", source: "Fear & Greed Index Korea", sourceUrl: "https://feargreed.co.kr/", note: "한국 시장 6개 지표로 별도 산출" }),
    ]),
    fetchCryptoSentiment().catch(() => unavailableSentiment({ id: "crypto", market: "암호화폐", detail: "BTC 중심 시장심리", source: "Alternative.me", sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/", note: "변동성·거래량·소셜 데이터 등 종합" })),
    fetchCryptoQuotes().catch(() => []),
    fetchNaverQuotes(),
    fetchYahooQuotes(),
    fetchMarketSparklines(),
  ]);
  const quotes = [...naverQuotes, ...yahooQuotes, ...cryptoQuotes].map((quote) => ({ ...quote, ...sparklines.get(quote.id) }));
  return Response.json(
    { sentiment: [...stockSentiments, cryptoSentiment], quotes, asOf: new Date().toISOString(), refreshSeconds: 15, delayedNotice: "15초마다 확인하며, 제공처에 따라 시세가 지연될 수 있습니다. 미국 주식은 정규장 시세를 표시합니다." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
