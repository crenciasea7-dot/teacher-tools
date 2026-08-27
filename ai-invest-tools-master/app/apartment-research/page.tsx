"use client";

import { useMemo, useState } from "react";
import "../tool-pages.css";

type Complex = { name: string; location: string; price: string; change: string; school: string; transit: string; note: string; score: number };
const complexes: Complex[] = [
  { name: "래미안 리더스원", location: "서울 서초구 · 2019년", price: "24.8억", change: "+3.1%", school: "학군 우수", transit: "2호선 8분", note: "실거주 수요와 생활 인프라가 강점", score: 82 },
  { name: "마포 래미안 푸르지오", location: "서울 마포구 · 2014년", price: "18.6억", change: "+1.8%", school: "학군 보통", transit: "5호선 6분", note: "직주근접·교통 접근성을 함께 점검", score: 76 },
  { name: "고덕 그라시움", location: "서울 강동구 · 2019년", price: "17.2억", change: "+2.6%", school: "학군 우수", transit: "5호선 10분", note: "대단지 수요와 공급 물량을 비교", score: 74 },
];

export default function ApartmentResearchPage() {
  const [query, setQuery] = useState("서울");
  const [budget, setBudget] = useState("20억 이하");
  const [selected, setSelected] = useState<Complex | null>(null);
  const results = useMemo(() => complexes.filter((complex) => !query || `${complex.name} ${complex.location}`.includes(query) || query.includes("서울")), [query]);

  return (
    <main className="public-tool-page research-tool">
      <a className="tool-back" href="/">← AI 투자 도구 MASTER</a>
      <section className="tool-intro centered"><p>FOCUS APARTMENT RESEARCH</p><h1>집중 아파트 비교 리서치</h1><span>로그인 없이 가격·입지·수요·리스크를 한 번에 비교하세요.</span></section>
      <section className="research-search">
        <label>관심 지역 또는 단지<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 마포구, 공덕역, 래미안" /></label>
        <label>예산<select value={budget} onChange={(event) => setBudget(event.target.value)}><option>10억 이하</option><option>15억 이하</option><option>20억 이하</option><option>20억 초과</option></select></label>
        <button type="button" onClick={() => setSelected(null)}>리서치 시작 →</button>
      </section>
      <section className="research-layout">
        <aside className="research-summary"><span>RESEARCH FILTER</span><h2>이번 리서치 기준</h2><div><small>관심 지역</small><b>{query || "전체"}</b></div><div><small>예산</small><b>{budget}</b></div><div><small>비교 단지</small><b>{results.length}개</b></div><p>단지의 좋고 나쁨보다 <b>내 목적과 가격</b>이 맞는지 확인하세요.</p></aside>
        <div className="research-results">
          <div className="research-heading"><div><span>COMPLEX SHORTLIST</span><h2>비교할 단지</h2></div><small>{results.length} results</small></div>
          {results.map((complex) => <button className="complex-row" type="button" key={complex.name} onClick={() => setSelected(complex)}><i>⌂</i><div><small>{complex.location}</small><h3>{complex.name}</h3><p>{complex.note}</p></div><strong>{complex.price}<small>{complex.change}</small></strong><em>{complex.score}<small>점검도</small></em><b>→</b></button>)}
          {results.length === 0 && <p className="research-empty">조건에 맞는 단지가 없습니다. 지역 또는 단지명을 바꿔보세요.</p>}
        </div>
      </section>
      {selected && <section className="research-detail"><div><span>RESEARCH SNAPSHOT</span><h2>{selected.name}</h2><p>{selected.location}</p></div><div><article><small>가격 흐름</small><b>{selected.price} · {selected.change}</b></article><article><small>학군</small><b>{selected.school}</b></article><article><small>교통</small><b>{selected.transit}</b></article><article><small>다음 확인</small><b>최근 실거래 3건 비교</b></article></div></section>}
      <p className="tool-disclaimer">공개 데이터와 현장 확인을 함께 보세요. 이 도구는 투자 권유가 아닌 리서치 정리용입니다.</p>
    </main>
  );
}
