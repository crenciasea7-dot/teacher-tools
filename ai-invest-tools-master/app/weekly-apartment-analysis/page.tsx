"use client";

import { useEffect, useState } from "react";

type District = { name: string; saleRate: number; previousSaleRate: number; jeonseRate: number; falling: boolean };
type AnalysisData = {
  latestDate: string;
  releaseDate: string;
  updatedAt: string;
  summary: Array<{ area: string; saleRate: number; previousSaleRate: number; jeonseRate: number }>;
  seoul: { gangnam: District[]; nonGangnam: District[] };
  analysis: { trend: string; jeonse: string; qualitative: string; transactionNote: string; phase: string; conclusion: string };
  methodology: string;
  sourceUrl: string;
};

const rate = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
const tone = (value: number) => value > 0 ? "up" : value < 0 ? "down" : "flat";

export default function WeeklyApartmentAnalysis() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/weekly-apartment-analysis", { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body; })
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, []);

  return <main className="weekly-analysis-page">
    <header className="weekly-analysis-hero">
      <a href="/">← AI 투자 도구 MASTER</a>
      <p>R-ONE WEEKLY AI REVIEW</p>
      <h1>주간 아파트 가격동향<br/><em>AI 분석</em></h1>
      <span>{data ? `조사기준일 ${data.latestDate.replaceAll("-", ".")} · 발표일 ${data.releaseDate.replaceAll("-", ".")}` : "최신 자료 불러오는 중"}</span>
    </header>
    {error && <div className="weekly-analysis-error">{error}</div>}
    {!data && !error && <div className="weekly-analysis-loading">한국부동산원 자료를 분석하고 있습니다…</div>}
    {data && <>
      <a className="weekly-source-dashboard" href="https://rone-weekly-capital-dashboard.vercel.app/" target="_blank" rel="noreferrer"><div><span>OFFICIAL R-ONE DASHBOARD</span><strong>주간 아파트 가격동향 공식 차트·표</strong><p>원본 시황 대시보드에서 전국·수도권·서울·지방 및 전체 구별 자료를 확인하세요.</p></div><b>대시보드 열기 ↗</b></a>
      <WeeklyRateChart rows={data.summary}/>
      <details className="weekly-official-details" open>
        <summary><span>R-ONE 공식 데이터 · 전체 차트·표</span><b>전국·수도권·서울·지방 및 전체 구별 자료</b></summary>
        <div className="weekly-official-details-body"><p>한국부동산원 R-ONE의 최신 공식 차트와 전체 구별 표를 새 화면에서 확인할 수 있습니다.</p><a href={data.sourceUrl} target="_blank" rel="noreferrer">공식 자료 열기 ↗</a></div>
      </details>
      <section className="weekly-analysis-card">
        <div className="weekly-section-title"><span>01</span><div><h2>데이터 표 정리</h2><p>매매·전세 주간 변동률</p></div></div>
        <div className="weekly-table-wrap"><table className="weekly-summary-table"><thead><tr><th>조사일</th><th>지역</th><th>매매</th><th>전주</th><th>전세</th></tr></thead><tbody>{data.summary.map((row) => <tr key={row.area}><td>{data.latestDate.slice(5).replace("-", ".")}</td><td><b>{row.area}</b></td><td className={tone(row.saleRate)}>{rate(row.saleRate)}</td><td>{rate(row.previousSaleRate)}</td><td className={tone(row.jeonseRate)}>{rate(row.jeonseRate)}</td></tr>)}</tbody></table></div>
        <small className="weekly-method">* {data.methodology}</small>
      </section>
      <section className="weekly-ai-conclusion"><span>FINAL DIAGNOSIS · AI 6단계 분석</span><b>{data.analysis.phase}</b><p>{data.analysis.conclusion}</p></section>
      <section className="weekly-analysis-card">
        <div className="weekly-section-title"><span>02</span><div><h2>서울 세분화</h2><p>강남권과 비강남권의 확산 여부</p></div></div>
        <div className="seoul-split"><DistrictGroup title="강남·서초" districts={data.seoul.gangnam}/><DistrictGroup title="비강남 관찰지역" districts={data.seoul.nonGangnam}/></div>
      </section>
      <section className="weekly-analysis-grid">
        <AnalysisStep number="03" title="추세 분석" lines={[data.analysis.trend, data.analysis.jeonse]}/>
        <AnalysisStep number="04" title="정성적 판단" lines={[data.analysis.qualitative, data.analysis.transactionNote]}/>
        <AnalysisStep number="05" title="최종 국면 진단" lines={[`선택 국면: ${data.analysis.phase}`, "다섯 개 후보 중 하나만 선택했습니다."]}/>
        <AnalysisStep number="06" title="결론 한 문장" lines={[data.analysis.conclusion]}/>
      </section>
      <div className="weekly-analysis-footer"><span>마지막 분석 {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(data.updatedAt))}</span></div>
    </>}
  </main>;
}

function DistrictGroup({ title, districts }: { title: string; districts: District[] }) {
  return <article><h3>{title}</h3>{districts.map((district) => <div key={district.name}><b>{district.name}</b><span className={tone(district.saleRate)}>매매 {rate(district.saleRate)}</span><span className={tone(district.jeonseRate)}>전세 {rate(district.jeonseRate)}</span></div>)}</article>;
}

function AnalysisStep({ number, title, lines }: { number: string; title: string; lines: string[] }) {
  return <article className="weekly-analysis-card compact"><div className="weekly-section-title"><span>{number}</span><div><h2>{title}</h2></div></div>{lines.map((line) => <p key={line}>{line}</p>)}</article>;
}

function WeeklyRateChart({ rows }: { rows: AnalysisData["summary"] }) {
  const ceiling = Math.max(0.01, ...rows.flatMap((row) => [Math.abs(row.saleRate), Math.abs(row.jeonseRate)]));
  return <section className="weekly-rate-chart" aria-label="지역별 매매와 전세 변동률 그래프">
    <div><span>RELATED GRAPH</span><h2>분석에 사용한 주간 변동률</h2><p>공식 표의 매매·전세 수치를 그대로 시각화했습니다.</p></div>
    <div className="weekly-rate-rows">{rows.map((row) => <article key={row.area}>
      <h3>{row.area}</h3>
      <div><span>매매</span><i className={tone(row.saleRate)} style={{ width: `${Math.max(5, Math.abs(row.saleRate) / ceiling * 100)}%` }}/><b className={tone(row.saleRate)}>{rate(row.saleRate)}</b></div>
      <div><span>전세</span><i className={tone(row.jeonseRate)} style={{ width: `${Math.max(5, Math.abs(row.jeonseRate) / ceiling * 100)}%` }}/><b className={tone(row.jeonseRate)}>{rate(row.jeonseRate)}</b></div>
    </article>)}</div>
  </section>;
}
