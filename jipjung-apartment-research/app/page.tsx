"use client";

import { useMemo, useState } from "react";

type Complex = { name: string; location: string; price: string; change: string; school: string; transit: string; note: string; score: number; };
const data: Complex[] = [
  { name: "래미안 리더스원", location: "서울 서초구 · 2019년", price: "24.8억", change: "+3.1%", school: "학군 우수", transit: "2호선 8분", note: "실거주 수요와 생활 인프라가 강점", score: 82 },
  { name: "마포 래미안 푸르지오", location: "서울 마포구 · 2014년", price: "18.6억", change: "+1.8%", school: "학군 보통", transit: "5호선 6분", note: "직주근접·교통 접근성을 함께 점검", score: 76 },
  { name: "고덕 그라시움", location: "서울 강동구 · 2019년", price: "17.2억", change: "+2.6%", school: "학군 우수", transit: "5호선 10분", note: "대단지 수요와 공급 물량을 비교", score: 74 },
];

export default function Home() {
  const [query, setQuery] = useState("서울 강남권");
  const [budget, setBudget] = useState("20억 이하");
  const [selected, setSelected] = useState<Complex | null>(null);
  const results = useMemo(() => data.filter((complex) => !query || `${complex.name} ${complex.location}`.includes(query) || query.includes("서울")), [query]);

  return (
    <main>
      <header><a href="#top"><span>⌂</span> 집중 아파트 리서치</a><button>내 리서치 노트 <b>↗</b></button></header>
      <section className="hero" id="top"><p className="eyebrow">FOCUS APARTMENT RESEARCH</p><h1>좋아 보이는 단지가 아니라,<br /><em>확인된 단지</em>를 고르세요.</h1><p>가격·입지·수요·리스크를 한 번에 정리하는 개인 아파트 리서치 보드입니다.</p></section>
      <section className="search-box">
        <label>관심 지역 또는 단지<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 마포구, 공덕역, 래미안" /></label>
        <label>예산<select value={budget} onChange={(event) => setBudget(event.target.value)}><option>10억 이하</option><option>15억 이하</option><option>20억 이하</option><option>20억 초과</option></select></label>
        <button onClick={() => setSelected(null)}>리서치 시작 <span>→</span></button>
      </section>

      <section className="dashboard">
        <aside className="summary"><p className="eyebrow">RESEARCH FILTER</p><h2>이번 리서치 기준</h2><div><span>관심 지역</span><b>{query || "전체"}</b></div><div><span>예산</span><b>{budget}</b></div><div><span>비교 단지</span><b>{results.length}개</b></div><article><span>✦</span><p>단지의 좋고 나쁨보다, <b>내 목적과 가격</b>이 맞는지 확인하세요.</p></article></aside>
        <div className="results"><div className="results-head"><div><p className="eyebrow">COMPLEX SHORTLIST</p><h2>비교할 단지</h2></div><span>{results.length} results</span></div>
          {results.map((complex) => <button className="complex-card" key={complex.name} onClick={() => setSelected(complex)}><div className="building">⌂</div><div className="complex-info"><p>{complex.location}</p><h3>{complex.name}</h3><span>{complex.note}</span></div><div className="price"><strong>{complex.price}</strong><span>{complex.change}</span></div><div className="score"><b>{complex.score}</b><span>점검도</span></div><i>→</i></button>)}
          {results.length === 0 && <div className="empty">조건에 맞는 단지가 없습니다. 지역 또는 단지명을 바꿔보세요.</div>}
        </div>
      </section>
      {selected && <section className="detail"><div><p className="eyebrow">RESEARCH SNAPSHOT</p><h2>{selected.name}</h2><p>{selected.location} · 현재 입력값 기준 요약</p></div><div className="detail-grid"><article><span>가격 흐름</span><b>{selected.price} <em>{selected.change}</em></b></article><article><span>학군</span><b>{selected.school}</b></article><article><span>교통</span><b>{selected.transit}</b></article><article><span>다음 확인</span><b>최근 실거래 3건 비교</b></article></div></section>}
      <footer>공개 데이터와 현장 확인을 함께 보세요. 이 도구는 투자 권유가 아닌 리서치 정리용입니다.</footer>
    </main>
  );
}
