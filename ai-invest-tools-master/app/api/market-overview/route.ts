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

export async function GET() {
  const [stockSentiments, cryptoSentiment] = await Promise.all([
    fetchStockSentiments().catch(() => [
      unavailableSentiment({ id: "us", market: "미국 주식", detail: "S&P 500 · NASDAQ", source: "CNN Fear & Greed", sourceUrl: "https://www.cnn.com/markets/fear-and-greed", note: "CNN의 7개 미국 시장 지표" }),
      unavailableSentiment({ id: "kr", market: "한국 주식", detail: "KOSPI · KOSDAQ", source: "Fear & Greed Index Korea", sourceUrl: "https://feargreed.co.kr/", note: "한국 시장 6개 지표로 별도 산출" }),
    ]),
    fetchCryptoSentiment().catch(() => unavailableSentiment({ id: "crypto", market: "암호화폐", detail: "BTC 중심 시장심리", source: "Alternative.me", sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/", note: "변동성·거래량·소셜 데이터 등 종합" })),
  ]);
  return Response.json(
    { sentiment: [...stockSentiments, cryptoSentiment], asOf: new Date().toISOString(), refreshSeconds: 300, delayedNotice: "거래소 정책에 따라 일부 시세가 지연될 수 있습니다." },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
