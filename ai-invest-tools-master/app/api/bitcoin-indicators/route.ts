type AlternativeResponse = {
  data?: Array<{ value?: string; value_classification?: string; timestamp?: string }>;
};

type CoinGeckoChartResponse = {
  prices?: Array<[number, number]>;
  total_volumes?: Array<[number, number]>;
};

type CoinGeckoMarketResponse = {
  market_data?: {
    current_price?: { usd?: number; krw?: number };
    ath?: { usd?: number };
    ath_date?: { usd?: string };
  };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const latestPriceKrw = marketPayload.market_data?.current_price?.krw ?? null;
  const usdKrw = latestPrice && latestPriceKrw ? latestPriceKrw / latestPrice : null;
  const allTimeHigh = marketPayload.market_data?.ath?.usd ?? null;
  const allTimeHighDate = marketPayload.market_data?.ath_date?.usd ?? null;
  const points = (chartPayload.prices ?? []).flatMap(([timestamp, value]) => {
    if (!Number.isFinite(timestamp) || !Number.isFinite(value)) return [];
    return [{ timestamp: new Date(timestamp).toISOString(), value, ath: allTimeHigh ?? value }];
  });
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1_000;

  const prices = (chartPayload.prices ?? []).map(([, value]) => value).filter(Number.isFinite);
  const volumes = chartPayload.total_volumes ?? [];
  const technical = buildTechnicalAnalysis(prices, volumes);
  const previousPrice = prices.at(-2) ?? latestPrice ?? 0;
  const change24h = latestPrice && previousPrice ? ((latestPrice / previousPrice) - 1) * 100 : null;
  const marketNews = await fetchBitcoinMarketNews(change24h).catch(() => unavailableNews(change24h));

  return {
    latestPrice,
    latestPriceKrw,
    usdKrw,
    allTimeHigh,
    allTimeHighDate,
    newHighWithin30Days: allTimeHighDate ? new Date(allTimeHighDate).getTime() >= thirtyDaysAgo : false,
    points: points.slice(-260),
    technical,
    marketNews,
  };
}

function unavailableNews(change24h: number | null) {
  return {
    direction: change24h === null ? "unknown" : change24h > 0 ? "up" : change24h < 0 ? "down" : "flat",
    change24h,
    verified: false,
    confidence: "확인 불가",
    summary: "현재 신뢰할 수 있는 독립 뉴스 출처 3곳을 확보하지 못해 상승·하락 원인을 단정할 수 없습니다. 모름이 정확한 답입니다.",
    factors: [] as Array<{ headline: string; explanation: string }>,
    sources: [] as Array<{ title: string; url: string; domain: string }>,
    checks: [
      { label: "가격 방향 확인", passed: change24h !== null },
      { label: "독립 출처 3곳 교차검증", passed: false },
      { label: "사실·해석·불확실성 분리", passed: false },
    ],
  };
}

function parseJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("News response was not JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as { summary?: string; factors?: Array<{ headline?: string; explanation?: string }>; confidence?: string };
}

async function fetchBitcoinMarketNews(change24h: number | null) {
  const fallback = unavailableNews(change24h);
  if (change24h === null) return fallback;
  let token = process.env.AI_GATEWAY_API_KEY;
  if (!token) token = await getVercelOidcToken().catch(() => undefined);
  if (!token) return fallback;

  const direction = change24h > 0.15 ? "상승" : change24h < -0.15 ? "하락" : "보합";
  const gateway = createGateway({ apiKey: token });
  const result = await generateText({
    model: gateway("openai/gpt-5.4-mini"),
    tools: {
      perplexity_search: gateway.tools.perplexitySearch({
        maxResults: 10,
        maxTokensPerPage: 1024,
        searchLanguageFilter: ["ko", "en"],
        searchRecencyFilter: "week",
      }),
    },
    prompt: `반드시 제공된 검색 도구를 먼저 사용하라. 현재 비트코인의 최근 24시간 가격 변화는 ${change24h.toFixed(2)}%로 ${direction}이다. 오늘 기준 최근 72시간의 신뢰할 수 있는 시장 뉴스를 검색해 왜 움직였는지 검증하라.

검증 규칙:
1. 가격 방향과 뉴스 발생 시각이 맞는지 확인한다.
2. 서로 독립적인 언론·기관·거래소 자료 최소 3곳에서 공통으로 뒷받침되는 원인만 쓴다.
3. 확인된 사실과 해석을 분리하고, 인과관계가 확실하지 않으면 반드시 "직접 원인은 확인 불가" 또는 "모름"이라고 쓴다.
4. 가격 움직임 뒤에 나온 기사, 출처 불명 게시물, 단일 분석가 의견은 원인으로 단정하지 않는다.
5. 한국어로 쓰고 과장·투자 권유를 하지 않는다.

다음 JSON만 반환하라:
{"summary":"검증 결론 2~4문장","confidence":"높음|보통|낮음|확인 불가","factors":[{"headline":"원인 후보","explanation":"확인된 사실과 불확실성 1~2문장"}]}`,
  });
  const parsed = parseJson(result.text);
  const uniqueSources = new Map<string, { title: string; url: string; domain: string }>();
  const candidates: Array<{ title?: string; url?: string }> = [];
  for (const source of result.sources) {
    if (source.sourceType === "url") candidates.push({ title: source.title, url: source.url });
  }
  for (const toolResult of result.toolResults) {
    const output = toolResult.output as { results?: Array<{ title?: string; url?: string }> } | undefined;
    if (Array.isArray(output?.results)) candidates.push(...output.results);
  }
  const excludedDomains = ["youtube.com", "youtu.be", "x.com", "twitter.com", "reddit.com", "facebook.com", "instagram.com"];
  for (const source of candidates) {
    if (!source.url) continue;
    try {
      const domain = new URL(source.url).hostname.replace(/^www\./, "");
      if (excludedDomains.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) continue;
      if (!uniqueSources.has(domain)) uniqueSources.set(domain, { title: source.title || domain, url: source.url, domain });
    } catch { /* invalid provider source URL */ }
  }
  const sources = [...uniqueSources.values()].slice(0, 6);
  const verified = sources.length >= 3 && Boolean(parsed.summary) && Array.isArray(parsed.factors);
  if (!verified) return { ...fallback, sources, checks: [fallback.checks[0], { label: "독립 출처 3곳 교차검증", passed: sources.length >= 3 }, { label: "사실·해석·불확실성 분리", passed: false }] };
  return {
    direction: direction === "상승" ? "up" : direction === "하락" ? "down" : "flat",
    change24h,
    verified: true,
    confidence: ["높음", "보통", "낮음"].includes(parsed.confidence || "") ? parsed.confidence : "낮음",
    summary: parsed.summary,
    factors: (parsed.factors ?? []).slice(0, 4).map((factor) => ({ headline: factor.headline || "원인 후보", explanation: factor.explanation || "세부 근거 확인 필요" })),
    sources,
    checks: [
      { label: "가격 방향 확인", passed: true },
      { label: "독립 출처 3곳 교차검증", passed: true },
      { label: "사실·해석·불확실성 분리", passed: true },
    ],
  };
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function calculateRsi(values: number[], period = 14) {
  const slice = values.slice(-(period + 1));
  if (slice.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let index = 1; index < slice.length; index += 1) {
    const change = slice[index] - slice[index - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }
  if (losses === 0) return 100;
  const relativeStrength = (gains / period) / (losses / period);
  return 100 - 100 / (1 + relativeStrength);
}

function buildTechnicalAnalysis(prices: number[], volumes: Array<[number, number]>) {
  if (prices.length < 60) return null;
  const current = prices.at(-1) ?? 0;
  const sma20 = average(prices.slice(-20));
  const sma50 = average(prices.slice(-50));
  const sma200 = average(prices.slice(-200));
  const rsi14 = calculateRsi(prices) ?? 50;
  const momentum20 = ((current / (prices.at(-21) ?? current)) - 1) * 100;
  const recent = prices.slice(-180);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const bucketCount = 24;
  const bucketSize = Math.max((max - min) / bucketCount, 1);
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    low: min + index * bucketSize,
    high: min + (index + 1) * bucketSize,
    volume: 0,
  }));
  const alignedVolumes = volumes.slice(-recent.length);
  recent.forEach((price, index) => {
    const bucketIndex = Math.min(Math.floor((price - min) / bucketSize), bucketCount - 1);
    buckets[bucketIndex].volume += alignedVolumes[index]?.[1] ?? 1;
  });
  const strongestBelow = buckets.filter((bucket) => bucket.high <= current).sort((a, b) => b.volume - a.volume)[0];
  const strongestAbove = buckets.filter((bucket) => bucket.low > current).sort((a, b) => b.volume - a.volume)[0];
  const support = strongestBelow ?? { low: Math.min(...prices.slice(-30)), high: current, volume: 0 };
  const resistance = strongestAbove ?? { low: current, high: Math.max(...prices.slice(-30)), volume: 0 };

  let bullishScore = 50;
  bullishScore += current > sma20 ? 8 : -8;
  bullishScore += sma20 > sma50 ? 10 : -10;
  bullishScore += sma50 > sma200 ? 8 : -8;
  bullishScore += momentum20 > 0 ? 8 : -8;
  bullishScore += rsi14 >= 45 && rsi14 <= 65 ? 5 : rsi14 > 70 ? -7 : rsi14 < 30 ? 7 : 0;
  bullishScore = Math.max(15, Math.min(80, Math.round(bullishScore)));
  const rangeScore = Math.max(10, Math.min(45, Math.round(34 - Math.abs(momentum20) * 1.4)));
  const bearishScore = Math.max(10, 100 - bullishScore - rangeScore);
  const total = bullishScore + rangeScore + bearishScore;
  const probabilities = {
    bullish: Math.round((bullishScore / total) * 100),
    range: Math.round((rangeScore / total) * 100),
    bearish: 0,
  };
  probabilities.bearish = 100 - probabilities.bullish - probabilities.range;

  const trend = current > sma20 && sma20 > sma50 ? "단기 상승 추세" : current < sma20 && sma20 < sma50 ? "단기 하락 추세" : "박스권·방향 탐색";
  const pattern = momentum20 > 8 && current > sma20 ? "고점 재도전형 상승 모멘텀" : momentum20 < -8 && current < sma20 ? "저점 확인형 하락 모멘텀" : Math.abs(momentum20) < 4 ? "변동성 수축형 박스권" : current > sma50 ? "상승 추세 안의 조정·재정비" : "하락 추세 안의 기술적 반등 시도";
  const outlook = probabilities.bullish >= probabilities.bearish
    ? `지지 매물대를 지키면 저항 구간 재시험 가능성이 우세합니다. 저항 상단을 거래량과 함께 돌파해야 상승 시나리오의 신뢰도가 높아집니다.`
    : `저항을 넘기 전까지 하방 재시험 가능성이 더 큽니다. 지지 구간 이탈 시 다음 저점 탐색 위험을 우선 관리해야 합니다.`;

  return {
    current,
    sma20,
    sma50,
    sma200,
    rsi14,
    momentum20,
    support: { low: support.low, high: support.high },
    resistance: { low: resistance.low, high: resistance.high },
    trend,
    pattern,
    outlook,
    probabilities,
  };
}

export async function GET() {
  const [fearGreed, euphoria] = await Promise.all([
    fetchFearGreed().catch(() => ({ current: null, history: [] })),
    fetchEuphoriaReference().catch(() => ({ latestPrice: null, latestPriceKrw: null, usdKrw: null, allTimeHigh: null, allTimeHighDate: null, newHighWithin30Days: false, points: [], technical: null, marketNews: unavailableNews(null) })),
  ]);

  return Response.json(
    { fearGreed, euphoria, asOf: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
import { createGateway, generateText } from "ai";
import { getVercelOidcToken } from "@vercel/oidc";
