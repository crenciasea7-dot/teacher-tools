type AlternativeResponse = {
  data?: Array<{ value?: string; value_classification?: string; timestamp?: string }>;
};

type CoinGeckoChartResponse = {
  prices?: Array<[number, number]>;
};

type CoinGeckoMarketResponse = {
  market_data?: {
    current_price?: { usd?: number };
    ath?: { usd?: number };
    ath_date?: { usd?: string };
  };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function translateLabel(label: string | undefined) {
  const labels: Record<string, string> = {
    "Extreme Fear": "극단적 공포",
    Fear: "공포",
    Neutral: "중립",
    Greed: "탐욕",
    "Extreme Greed": "극단적 탐욕",
  };
  return label ? (labels[label] ?? label) : "확인 중";
}

async function fetchFearGreed() {
  const response = await fetch("https://api.alternative.me/fng/?limit=30&format=json", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Fear and greed request failed: ${response.status}`);

  const payload = (await response.json()) as AlternativeResponse;
  const history = (payload.data ?? []).flatMap((item) => {
    const value = Number(item.value);
    const timestamp = Number(item.timestamp);
    if (!Number.isFinite(value) || !Number.isFinite(timestamp)) return [];
    return [{ value, label: translateLabel(item.value_classification), timestamp: new Date(timestamp * 1_000).toISOString() }];
  }).reverse();

  return { current: history.at(-1) ?? null, history };
}

async function fetchEuphoriaReference() {
  const [chartResponse, marketResponse] = await Promise.all([
    fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)" },
      next: { revalidate: 3_600 },
      signal: AbortSignal.timeout(10_000),
    }),
    fetch("https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)" },
      next: { revalidate: 3_600 },
      signal: AbortSignal.timeout(10_000),
    }),
  ]);
  if (!chartResponse.ok || !marketResponse.ok) throw new Error(`Bitcoin history request failed: ${chartResponse.status}/${marketResponse.status}`);

  const chartPayload = (await chartResponse.json()) as CoinGeckoChartResponse;
  const marketPayload = (await marketResponse.json()) as CoinGeckoMarketResponse;
  const latestPrice = marketPayload.market_data?.current_price?.usd ?? null;
  const allTimeHigh = marketPayload.market_data?.ath?.usd ?? null;
  const allTimeHighDate = marketPayload.market_data?.ath_date?.usd ?? null;
  const points = (chartPayload.prices ?? []).flatMap(([timestamp, value]) => {
    if (!Number.isFinite(timestamp) || !Number.isFinite(value)) return [];
    return [{ timestamp: new Date(timestamp).toISOString(), value, ath: allTimeHigh ?? value }];
  });
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1_000;

  return {
    latestPrice,
    allTimeHigh,
    allTimeHighDate,
    newHighWithin30Days: allTimeHighDate ? new Date(allTimeHighDate).getTime() >= thirtyDaysAgo : false,
    points: points.slice(-260),
  };
}

export async function GET() {
  const [fearGreed, euphoria] = await Promise.all([
    fetchFearGreed().catch(() => ({ current: null, history: [] })),
    fetchEuphoriaReference().catch(() => ({ latestPrice: null, allTimeHigh: null, allTimeHighDate: null, newHighWithin30Days: false, points: [] })),
  ]);

  return Response.json(
    { fearGreed, euphoria, asOf: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
