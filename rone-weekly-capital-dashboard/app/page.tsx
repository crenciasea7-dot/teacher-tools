"use client";

import { useMemo, useState } from "react";

type Account = { name: string; kind: string; value: number; change: number; color: string };
const accounts: Account[] = [
  { name: "부동산", kind: "실물자산", value: 124000, change: 0.8, color: "#f7a973" },
  { name: "주식 · ETF", kind: "금융자산", value: 36200, change: 2.6, color: "#5c8df6" },
  { name: "현금 · 예금", kind: "대기자금", value: 18800, change: 0.1, color: "#5bba9b" },
  { name: "기타 투자", kind: "대체자산", value: 7200, change: -1.2, color: "#a88ce6" }
];
const weeks = ["7/20", "7/27", "8/03", "8/10", "8/17", "8/24"];
const trend = [176800, 178400, 177900, 180500, 184100, 186200];
const fmt = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}만`;

export default function Page() {
  const [tab, setTab] = useState("대시보드");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const total = useMemo(() => accounts.reduce((sum, account) => sum + account.value, 0), []);
  const max = Math.max(...trend); const min = Math.min(...trend);
  const points = trend.map((value, index) => `${(index / (trend.length - 1)) * 100},${100 - ((value - min) / (max - min)) * 76 - 10}`).join(" ");

  if (tab === "주간 기록") return <main><Top tab={tab} setTab={setTab} /><section className="record"><p className="eyebrow">WEEKLY REVIEW · 2026.08.24</p><h1>이번 주의 자본 판단을<br />남겨두세요.</h1><p>수익률보다 먼저, 내가 어떤 근거로 움직였는지 기록합니다.</p><div className="questions"><label>이번 주 자본 변동의 가장 큰 이유<textarea placeholder="예: ETF 상승으로 금융자산이 늘었고, 현금은 유지했다." /></label><label>다음 주에 확인할 것<textarea placeholder="예: 관심 단지의 인허가 문서와 매수 후보 ETF의 실적 발표" /></label></div><button className="save" onClick={() => { setSaved(true); setNote("이번 주 기록이 저장되었습니다."); }}>주간 기록 저장 <span>→</span></button>{saved && <small className="saved">✓ {note}</small>}</section></main>;

  return <main><Top tab={tab} setTab={setTab} />
    <section className="intro"><div><p className="eyebrow">RONE CAPITAL OS · WEEK 34</p><h1>자본을 보고,<br /><em>다음 움직임</em>을 정합니다.</h1><p>순자산의 변화와 투자 판단을 한 화면에서 점검하세요.</p></div><button className="week" onClick={() => setTab("주간 기록")}><span>이번 주 기록</span><b>08.24 — 08.30</b><i>→</i></button></section>
    <section className="numbers"><Metric label="총 순자산" value={fmt(total)} note="지난주 대비 +1,850만" /><Metric label="이번 주 수익" value="+1,850만" note="수익률 +1.00%" positive /><Metric label="현금 비중" value="10.1%" note="목표 비중 12.0%" /><Metric label="투자 여력" value="7,500만" note="즉시 투입 가능" /></section>
    <section className="grid"><article className="card trend"><div className="card-head"><div><p className="eyebrow">NET WORTH TREND</p><h2>순자산 흐름</h2></div><span>최근 6주</span></div><div className="chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ff8c56" stopOpacity=".33"/><stop offset="1" stopColor="#ff8c56" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill="url(#fill)"/><polyline points={points} fill="none" stroke="#ed6b32" strokeWidth="2.4" vectorEffect="non-scaling-stroke"/></svg><div className="axis">{weeks.map((week) => <span key={week}>{week}</span>)}</div></div><div className="trend-foot"><b>{fmt(trend.at(-1) ?? 0)}</b><span>6주 전보다 <strong>+9,400만</strong></span></div></article>
      <article className="card allocation"><div className="card-head"><div><p className="eyebrow">ALLOCATION</p><h2>자산 배분</h2></div><span>기준일 08.24</span></div><div className="donut" style={{ background: `conic-gradient(${accounts.map((account, i) => `${account.color} ${accounts.slice(0, i).reduce((s,a)=>s+a.value,0)/total*100}% ${(accounts.slice(0, i+1).reduce((s,a)=>s+a.value,0)/total*100)}%`).join(",")})` }}><div><b>100%</b><span>배분 완료</span></div></div><div className="legend">{accounts.map(account => <div key={account.name}><i style={{ background: account.color }} /><span>{account.name}</span><b>{Math.round(account.value / total * 100)}%</b></div>)}</div></article>
    </section>
    <section className="bottom"><article className="card accounts"><div className="card-head"><div><p className="eyebrow">CAPITAL MAP</p><h2>자산별 현황</h2></div><button>전체 보기 →</button></div>{accounts.map(account => <div className="account" key={account.name}><i style={{ background: account.color }} /><div><b>{account.name}</b><span>{account.kind}</span></div><strong>{fmt(account.value)}</strong><em className={account.change >= 0 ? "up" : "down"}>{account.change >= 0 ? "+" : ""}{account.change}%</em></div>)}</article>
    <article className="card focus"><p className="eyebrow">NEXT FOCUS</p><h2>다음 주의<br /><em>자본 우선순위</em></h2><ol><li><span>01</span><div><b>현금 목표 비중 회복</b><small>투자 여력 7,500만 유지</small></div></li><li><span>02</span><div><b>서울 정비사업 인허가 점검</b><small>관심 지역 공식 공고 확인</small></div></li><li><span>03</span><div><b>ETF 실적·밸류에이션 검토</b><small>신규 매수 전 근거 갱신</small></div></li></ol></article></section>
  </main>;
}

function Top({ tab, setTab }: { tab: string; setTab: (tab: string) => void }) { return <header><div className="logo"><span>R</span><div><b>RONE</b><small>Weekly Capital Dashboard</small></div></div><nav>{["대시보드", "주간 기록", "자산 지도"].map(item => <button key={item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}>{item}</button>)}</nav><div className="date">2026.08.24 <i>●</i></div></header>; }
function Metric({ label, value, note, positive }: { label: string; value: string; note: string; positive?: boolean }) { return <article><span>{label}</span><b>{value}</b><small className={positive ? "positive" : ""}>{positive ? "↗ " : ""}{note}</small></article>; }
