"use client";

import { useMemo, useState } from "react";

type AssetKind = "부동산" | "금융자산" | "현금";

type Asset = {
  kind: AssetKind;
  name: string;
  detail: string;
  value: number;
  change: number;
  accent: string;
};

const assets: Asset[] = [
  { kind: "부동산", name: "내 집", detail: "실거주 · 서울", value: 820000000, change: 2.4, accent: "#f3a43b" },
  { kind: "부동산", name: "투자 부동산", detail: "임대 · 수도권", value: 410000000, change: 1.1, accent: "#df7d3c" },
  { kind: "금융자산", name: "국내·해외 주식", detail: "장기 투자", value: 168000000, change: 6.8, accent: "#5278f2" },
  { kind: "금융자산", name: "연금·ETF", detail: "노후 준비", value: 92000000, change: 4.2, accent: "#8057d9" },
  { kind: "현금", name: "예비 자금", detail: "입출금·CMA", value: 68000000, change: 0, accent: "#46a98a" },
];

const labels: Record<AssetKind, string> = {
  부동산: "부동산",
  금융자산: "금융자산",
  현금: "현금·예비자금",
};

const money = (value: number) => `${Math.round(value / 100000000 * 10) / 10}억`;
const won = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";

export default function DashboardPage() {
  const [filter, setFilter] = useState<"전체" | AssetKind>("전체");
  const [privacyMode, setPrivacyMode] = useState(false);
  const total = assets.reduce((sum, asset) => sum + asset.value, 0);
  const visibleAssets = filter === "전체" ? assets : assets.filter((asset) => asset.kind === filter);
  const groups = useMemo(
    () => (Object.keys(labels) as AssetKind[]).map((kind) => ({
      kind,
      value: assets.filter((asset) => asset.kind === kind).reduce((sum, asset) => sum + asset.value, 0),
    })),
    [],
  );

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">MOYO ASSET DASHBOARD</p>
          <h1>내 자산을, 내 속도로.</h1>
          <p className="hero-copy">부동산 · 금융자산 · 현금을 한 화면에서 보고 다음 선택을 정리합니다.</p>
        </div>
        <button className="privacy-button" onClick={() => setPrivacyMode((value) => !value)}>
          {privacyMode ? "금액 보기" : "금액 가리기"}
        </button>
      </section>

      <section className="summary-grid" aria-label="자산 요약">
        <article className="total-card">
          <p>총자산</p>
          <strong>{privacyMode ? "••••••" : money(total)}</strong>
          <span>{privacyMode ? "" : won(total)}</span>
        </article>
        {groups.map((group) => (
          <article className="summary-card" key={group.kind}>
            <p>{labels[group.kind]}</p>
            <strong>{privacyMode ? "••••••" : money(group.value)}</strong>
            <span>{privacyMode ? "" : `${Math.round((group.value / total) * 100)}% 비중`}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel allocation-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PORTFOLIO</p>
              <h2>자산 배분</h2>
            </div>
            <span className="muted">오늘 기준</span>
          </div>
          <div className="allocation-bars">
            {groups.map((group) => {
              const ratio = Math.round((group.value / total) * 100);
              return (
                <div className="allocation-row" key={group.kind}>
                  <div className="allocation-label"><span>{labels[group.kind]}</span><b>{ratio}%</b></div>
                  <div className={`bar bar-${group.kind}`}><i style={{ width: `${ratio}%` }} /></div>
                  <small>{privacyMode ? "••••••" : money(group.value)}</small>
                </div>
              );
            })}
          </div>
          <div className="insight">
            <span>✦</span>
            <p>부동산 비중이 높습니다. 다음 투자금은 현금 여유와 금융자산 분산을 함께 확인해 보세요.</p>
          </div>
        </article>

        <article className="panel action-panel">
          <p className="eyebrow">THIS MONTH</p>
          <h2>이번 달 체크</h2>
          <ul>
            <li><span>01</span> 부동산 대출 이자 확인</li>
            <li><span>02</span> ETF 자동매수 내역 점검</li>
            <li><span>03</span> 생활비·예비자금 보충</li>
          </ul>
          <button className="primary-button">이번 달 계획 열기 <span>→</span></button>
        </article>
      </section>

      <section className="asset-section">
        <div className="section-heading asset-heading">
          <div>
            <p className="eyebrow">ASSETS</p>
            <h2>내 자산 목록</h2>
          </div>
          <div className="filters" role="tablist" aria-label="자산 분류">
            {(["전체", "부동산", "금융자산", "현금"] as const).map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={filter === item ? "active" : ""}>{item}</button>
            ))}
          </div>
        </div>

        <div className="asset-list">
          {visibleAssets.map((asset) => (
            <article className="asset-row" key={asset.name}>
              <div className="asset-icon" style={{ background: asset.accent }}>{asset.kind === "부동산" ? "⌂" : asset.kind === "금융자산" ? "↗" : "₩"}</div>
              <div className="asset-name"><b>{asset.name}</b><span>{asset.detail}</span></div>
              <span className="kind-tag">{asset.kind}</span>
              <div className="asset-value"><b>{privacyMode ? "••••••" : money(asset.value)}</b><span className={asset.change > 0 ? "positive" : "muted"}>{asset.change > 0 ? `+${asset.change}%` : "변동 없음"}</span></div>
              <button className="more-button" aria-label={`${asset.name} 상세 보기`}>•••</button>
            </article>
          ))}
        </div>
      </section>

      <footer>moyo · 나에게 맞는 속도로 자산을 쌓습니다.</footer>
    </main>
  );
}
