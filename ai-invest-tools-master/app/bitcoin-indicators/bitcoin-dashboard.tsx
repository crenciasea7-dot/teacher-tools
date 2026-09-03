"use client";

import { useEffect, useState } from "react";

type FearGreedPoint = { value: number; label: string; timestamp: string };
type PricePoint = { timestamp: string; value: number; ath: number };
type TechnicalAnalysis = {
  current: number; sma20: number; sma50: number; sma200: number; rsi14: number; momentum20: number;
  support: { low: number; high: number }; resistance: { low: number; high: number };
  trend: string; pattern: string; outlook: string;
  probabilities: { bullish: number; range: number; bearish: number };
};
type MarketNews = {
  direction: "up" | "down" | "flat" | "unknown"; change24h: number | null; verified: boolean; confidence: string; summary: string;
  factors: Array<{ headline: string; explanation: string }>;
  sources: Array<{ title: string; url: string; domain: string }>;
  checks: Array<{ label: string; passed: boolean }>;
};
type BitcoinReferenceResponse = {
  fearGreed: { current: FearGreedPoint | null; history: FearGreedPoint[] };
  euphoria: {
    latestPrice: number | null;
    allTimeHigh: number | null;
    allTimeHighDate: string | null;
    newHighWithin30Days: boolean;
    points: PricePoint[];
    technical: TechnicalAnalysis | null;
    marketNews: MarketNews;
  };
  asOf: string;
};

const tradingViewBase = "https://s.tradingview.com/widgetembed/";

function tradingViewUrl(symbol: "BTCUSDT" | "BTC.D" | "USDT.D") {
  const isPriceChart = symbol === "BTCUSDT";
  const params = new URLSearchParams({
    frameElementId: `tradingview_${symbol.replace(".", "_").toLowerCase()}`,
    symbol: isPriceChart ? "BINANCE:BTCUSDT" : `CRYPTOCAP:${symbol}`,
    interval: isPriceChart ? "60" : "D",
    hidesidetoolbar: isPriceChart ? "0" : "1",
    symboledit: "0",
    saveimage: "0",
    toolbarbg: "f1f3f6",
    theme: "dark",
    style: "1",
    timezone: "Asia/Seoul",
    withdateranges: "1",
    hideideas: "1",
    locale: "kr",
  });
  return `${tradingViewBase}?${params.toString()}`;
}

function linePath(values: number[], width: number, height: number) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / spread) * (height - 12) - 6;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function formatDollars(value: number | null) {
  return value === null ? "불러오는 중" : `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

function FearGreedPanel({ data }: { data: BitcoinReferenceResponse | null }) {
  const current = data?.fearGreed.current;
  const score = current?.value ?? 50;
  const angle = -180 + (score / 100) * 180;
  const history = data?.fearGreed.history ?? [];

  return (
    <article className="bitcoin-live-panel fear-greed-panel">
      <div className="bitcoin-panel-heading">
        <div><span>02 · MARKET SENTIMENT</span><h2>크립토 공포·탐욕 지수</h2></div>
        <small>Alternative.me · 외부 업체</small>
      </div>
      <div className="bitcoin-gauge-wrap">
        <div className="bitcoin-gauge" role="meter" aria-label={`공포탐욕지수 ${current?.value ?? "불러오는 중"}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={current?.value}>
          <div className="bitcoin-gauge-needle" style={{ transform: `rotate(${angle}deg)` }} />
          <div className="bitcoin-gauge-center"><strong>{current?.value ?? "–"}</strong><span>{current?.label ?? "불러오는 중"}</span></div>
        </div>
        <div className="bitcoin-gauge-copy">
          <b>오늘 시장 심리</b>
          <p>0에 가까울수록 공포, 100에 가까울수록 탐욕입니다. 극단 구간에서는 추격보다 위험 관리부터 점검하세요.</p>
        </div>
      </div>
      <div className="bitcoin-mini-chart">
        <div><b>최근 30일 흐름</b><span>{history.length ? `${history.at(0)?.value} → ${history.at(-1)?.value}` : "데이터 확인 중"}</span></div>
        <svg viewBox="0 0 600 110" preserveAspectRatio="none" role="img" aria-label="최근 30일 공포탐욕지수 추이">
          <path d={linePath(history.map((point) => point.value), 600, 110)} />
        </svg>
      </div>
    </article>
  );
}

function EmbeddedChart({ step, title, source, description, src, externalUrl, externalLabel = "원문 사이트에서 보기 ↗" }: { step: string; title: string; source: string; description: string; src: string; externalUrl?: string; externalLabel?: string }) {
  return (
    <article className="bitcoin-live-panel embedded-chart-panel">
      <div className="bitcoin-panel-heading">
        <div><span>{step}</span><h2>{title}</h2><p>{description}</p></div>
        <small>{source} · 외부 업체</small>
      </div>
      <div className="bitcoin-embed-frame">
        <iframe src={src} title={`${title} 임베드 차트`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      {externalUrl ? <a className="bitcoin-source-link" href={externalUrl} target="_blank" rel="noreferrer">{externalLabel}</a> : null}
    </article>
  );
}

function TechnicalAnalysisPanel({ analysis }: { analysis: TechnicalAnalysis | null | undefined }) {
  const money = (value: number) => `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
  if (!analysis) return <article className="bitcoin-technical-panel loading"><b>기술적 분석 계산 중…</b><p>최근 가격과 거래량 데이터를 불러오고 있습니다.</p></article>;
  const probabilityItems = [
    { label: "상승", value: analysis.probabilities.bullish, tone: "bullish" },
    { label: "횡보", value: analysis.probabilities.range, tone: "range" },
    { label: "하락", value: analysis.probabilities.bearish, tone: "bearish" },
  ];
  return (
    <article className="bitcoin-technical-panel">
      <header><div><span>AUTO TECHNICAL READ</span><h2>차트 기술적 분석</h2></div><small>최근 180일 가격·거래량 기준</small></header>
      <div className="technical-zone-grid">
        <section className="support"><span>핵심 지지 매물대</span><strong>{money(analysis.support.low)} – {money(analysis.support.high)}</strong><p>이 구간을 지키면 반등 시나리오가 유지됩니다.</p></section>
        <section className="resistance"><span>핵심 저항 매물대</span><strong>{money(analysis.resistance.low)} – {money(analysis.resistance.high)}</strong><p>거래량을 동반해 넘겨야 추가 상승이 유리합니다.</p></section>
      </div>
      <div className="technical-reading-grid">
        <section><span>현재 추세</span><strong>{analysis.trend}</strong><p>20일선 {money(analysis.sma20)} · 50일선 {money(analysis.sma50)} · RSI {analysis.rsi14.toFixed(1)}</p></section>
        <section><span>관찰 패턴</span><strong>{analysis.pattern}</strong><p>최근 20일 모멘텀 {analysis.momentum20 >= 0 ? "+" : ""}{analysis.momentum20.toFixed(1)}%</p></section>
      </div>
      <div className="technical-probabilities">
        <div><span>향후 조건부 시나리오 우세도</span><small>통계적 예측값이 아닌 기술 신호 점수</small></div>
        {probabilityItems.map((item) => <div className={`technical-probability ${item.tone}`} key={item.label}><b>{item.label} {item.value}%</b><i><span style={{ width: `${item.value}%` }} /></i></div>)}
      </div>
      <p className="technical-outlook"><b>가능성이 높은 흐름</b>{analysis.outlook}</p>
      <p className="technical-caution">※ 종가 기반 근사 매물대와 이동평균·RSI·모멘텀을 조합한 참고 분석입니다. 미래 가격을 보장하지 않으며, 실시간 차트의 거래량과 돌파 여부를 함께 확인하세요.</p>
    </article>
  );
}

function MarketNewsPanel({ news }: { news: MarketNews | undefined }) {
  if (!news) return <article className="bitcoin-news-panel loading"><b>가격 변동 뉴스 3중 검토 중…</b><p>최근 72시간 자료를 교차 확인하고 있습니다.</p></article>;
  const directionLabel = news.direction === "up" ? "상승" : news.direction === "down" ? "하락" : news.direction === "flat" ? "보합" : "방향 확인 불가";
  return (
    <article className={`bitcoin-news-panel ${news.verified ? "verified" : "unknown"}`}>
      <header><div><span>WHY DID BTC MOVE?</span><h2>왜 {directionLabel}했나 · 시장 뉴스 검증</h2></div><strong>{news.change24h === null ? "변동률 확인 불가" : `24시간 ${news.change24h >= 0 ? "+" : ""}${news.change24h.toFixed(2)}%`}</strong></header>
      <div className="news-verification-row">{news.checks.map((check) => <span className={check.passed ? "passed" : "failed"} key={check.label}>{check.passed ? "✓" : "?"} {check.label}</span>)}</div>
      <section className="news-summary"><b>{news.verified ? `검증 결론 · 신뢰도 ${news.confidence}` : "확인 불가 · 모름"}</b><p>{news.summary}</p></section>
      {news.factors.length ? <div className="news-factor-grid">{news.factors.map((factor) => <section key={factor.headline}><b>{factor.headline}</b><p>{factor.explanation}</p></section>)}</div> : null}
      {news.sources.length ? <div className="news-sources"><b>교차 확인 출처</b><div>{news.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}>{source.title} <small>{source.domain}</small> ↗</a>)}</div></div> : null}
      <p className="news-honesty-note">가격 변동에는 여러 요인이 동시에 작용합니다. 기사와 가격의 시간 순서가 맞아도 인과관계가 입증되지 않으면 원인으로 단정하지 않습니다.</p>
    </article>
  );
}

function EuphoriaPanel({ data }: { data: BitcoinReferenceResponse | null }) {
  const euphoria = data?.euphoria;
  const points = euphoria?.points ?? [];
  const isEuphoria = euphoria?.newHighWithin30Days ?? false;

  return (
    <article className="bitcoin-live-panel euphoria-panel">
      <div className="bitcoin-panel-heading">
        <div><span>06 · ON-CHAIN FRAMEWORK</span><h2>Glassnode: Euphoria Zone</h2><p>신고가가 최근 30일 안에 갱신됐는지 확인하는 공개 프레임워크를 이 화면에서 재현합니다.</p></div>
        <small>Glassnode 기준 · Yahoo Finance 시세</small>
      </div>
      <div className="euphoria-summary">
        <div><span>현재 BTC</span><strong>{formatDollars(euphoria?.latestPrice ?? null)}</strong></div>
        <div><span>역대 최고가</span><strong>{formatDollars(euphoria?.allTimeHigh ?? null)}</strong></div>
        <div className={isEuphoria ? "active" : "calm"}><span>현재 국면</span><strong>{euphoria ? (isEuphoria ? "EUPHORIA" : "관찰 구간") : "계산 중"}</strong></div>
      </div>
      <div className="euphoria-chart">
        <div><b>BTC 가격</b><span>최고가 기준선</span></div>
        <svg viewBox="0 0 900 250" preserveAspectRatio="none" role="img" aria-label="비트코인 가격과 역대 최고가 추이">
          <path className="ath-line" d={linePath(points.map((point) => point.ath), 900, 250)} />
          <path className="price-line" d={linePath(points.map((point) => point.value), 900, 250)} />
        </svg>
      </div>
      <p className="euphoria-note">공개 차트의 해석 기준을 참고해 재현한 보조 지표이며 Glassnode의 유료 원데이터를 복제하지 않습니다.</p>
    </article>
  );
}

export default function BitcoinDashboard() {
  const [data, setData] = useState<BitcoinReferenceResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/bitcoin-indicators", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Bitcoin reference request failed");
        return response.json() as Promise<BitcoinReferenceResponse>;
      })
      .then((payload) => { setData(payload); setError(false); })
      .catch((requestError: unknown) => {
        if (!(requestError instanceof DOMException && requestError.name === "AbortError")) setError(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="bitcoin-live-dashboard" aria-label="비트코인 실시간 참고 지표">
      {error ? <p className="bitcoin-data-error">실시간 숫자를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.</p> : null}
      <EmbeddedChart step="01 · LIVE PRICE" title="비트코인 실시간 시세 차트" source="TradingView · Binance" description="BTC/USDT 캔들, 거래량과 시간대별 가격 흐름을 실시간으로 확인합니다." src={tradingViewUrl("BTCUSDT")} externalUrl="https://www.tradingview.com/chart/?symbol=BINANCE%3ABTCUSDT" externalLabel="TradingView에서 크게 보기 ↗" />
      <TechnicalAnalysisPanel analysis={data?.euphoria.technical} />
      <MarketNewsPanel news={data?.euphoria.marketNews} />
      <FearGreedPanel data={data} />
      <EmbeddedChart step="03 · LONG-TERM POSITION" title="비트코인 레인보우 차트" source="BlockchainCenter" description="장기 가격 위치와 과열·침체 밴드를 페이지 안에서 직접 확인합니다." src="https://www.blockchaincenter.net/bitcoin-rainbow-chart/" externalUrl="https://www.blockchaincenter.net/bitcoin-rainbow-chart/" externalLabel="레인보우 차트 원문 사이트에서 보기 ↗" />
      <div className="dominance-grid">
        <EmbeddedChart step="04 · CAPITAL FLOW" title="비트코인 도미넌스" source="TradingView" description="BTC로 자금이 집중되는지 확인합니다." src={tradingViewUrl("BTC.D")} />
        <EmbeddedChart step="05 · WAITING CAPITAL" title="테더 도미넌스" source="TradingView" description="스테이블코인 대기자금과 위험 회피 흐름을 확인합니다." src={tradingViewUrl("USDT.D")} />
      </div>
      <EuphoriaPanel data={data} />
    </section>
  );
}
