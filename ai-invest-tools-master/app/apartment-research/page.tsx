"use client";

import { useMemo, useRef, useState } from "react";
import "../tool-pages.css";

type Complex = { name: string; location: string; price: string; change: string; school: string; transit: string; note: string; score: number; area: string; mapUrl: string; naverUrl: string };
const priceInBillions = (value: string) => Number.parseFloat(value.replace("억", ""));
const complexes: Complex[] = [
  { name: "래미안 리더스원", location: "서울 서초구 · 2019년", price: "24.8억", change: "+3.1%", school: "학군 우수", transit: "2호선 8분", note: "실거주 수요와 생활 인프라가 강점", score: 82, area: "전용 84㎡ (약 25평)", mapUrl: "https://map.naver.com/p/search/래미안%20리더스원", naverUrl: "https://new.land.naver.com/complexes/118344" },
  { name: "마포 래미안 푸르지오", location: "서울 마포구 · 2014년", price: "18.6억", change: "+1.8%", school: "학군 보통", transit: "5호선 6분", note: "직주근접·교통 접근성을 함께 점검", score: 76, area: "전용 84㎡ (약 25평)", mapUrl: "https://map.naver.com/p/search/마포%20래미안%20푸르지오", naverUrl: "https://new.land.naver.com/complexes/104226" },
  { name: "고덕 그라시움", location: "서울 강동구 · 2019년", price: "17.2억", change: "+2.6%", school: "학군 우수", transit: "5호선 10분", note: "대단지 수요와 공급 물량을 비교", score: 74, area: "전용 84㎡ (약 25평)", mapUrl: "https://map.naver.com/p/search/고덕%20그라시움", naverUrl: "https://new.land.naver.com/complexes/116379" },
  { name: "공덕 자이", location: "서울 마포구 · 2013년", price: "9.8억", change: "+1.2%", school: "학군 보통", transit: "5호선 5분", note: "직주근접과 예산 적합성을 점검", score: 71, area: "전용 59㎡ (약 18평)", mapUrl: "https://map.naver.com/p/search/공덕자이", naverUrl: "https://new.land.naver.com/complexes/106950" },
  { name: "상계 주공", location: "서울 노원구 · 1988년", price: "7.6억", change: "-0.4%", school: "학군 보통", transit: "4호선 8분", note: "재건축 가능성과 추가 분담금을 확인", score: 68, area: "전용 58㎡ (약 18평)", mapUrl: "https://map.naver.com/p/search/상계주공", naverUrl: "https://new.land.naver.com/complexes/11111" },
];

export default function ApartmentResearchPage() {
  const [query, setQuery] = useState("서울");
  const [budget, setBudget] = useState("20억 이하");
  const [selected, setSelected] = useState<Complex | null>(null);
  const [searched, setSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const maxBudget = budget === "10억 이하" ? 10 : budget === "15억 이하" ? 15 : budget === "20억 이하" ? 20 : Infinity;
    return complexes.filter((complex) => {
      const searchable = `${complex.name} ${complex.location}`.toLowerCase();
      const queryMatches = !normalizedQuery || searchable.includes(normalizedQuery);
      return queryMatches && (maxBudget === Infinity || priceInBillions(complex.price) <= maxBudget);
    });
  }, [query, budget]);

  function startResearch() {
    const first = results[0] ?? null;
    setSelected(first);
    setSearched(true);
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <main className="public-tool-page research-tool">
      <a className="tool-back" href="/">← AI 투자 도구 MASTER</a>
      <section className="tool-intro centered"><p>FOCUS APARTMENT RESEARCH</p><h1>집중 아파트 비교 리서치</h1><span>로그인 없이 가격·입지·수요·리스크를 한 번에 비교하세요.</span></section>
      <section className="research-search">
        <label>관심 지역 또는 단지<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 마포구, 공덕역, 래미안" /></label>
        <label>예산<select value={budget} onChange={(event) => setBudget(event.target.value)}><option>10억 이하</option><option>15억 이하</option><option>20억 이하</option><option>20억 초과</option></select></label>
        <button type="button" onClick={startResearch} aria-label="리서치 시작">리서치 시작 →</button>
      </section>
      {searched && <p className="research-confirm" role="status">조건을 적용했습니다. 아래 비교 단지 결과를 확인하세요.</p>}
      <section className="research-layout" ref={resultsRef}>
        <aside className="research-summary"><span>RESEARCH FILTER</span><h2>이번 리서치 기준</h2><div><small>관심 지역</small><b>{query || "전체"}</b></div><div><small>예산</small><b>{budget}</b></div><div><small>비교 단지</small><b>{results.length}개</b></div><p>단지의 좋고 나쁨보다 <b>내 목적과 가격</b>이 맞는지 확인하세요.</p></aside>
        <div className="research-results">
          <div className="research-heading"><div><span>COMPLEX SHORTLIST</span><h2>비교할 단지</h2></div><small>{results.length} results</small></div>
          {results.map((complex) => <button className="complex-row" type="button" key={complex.name} onClick={() => setSelected(complex)}><i>⌂</i><div><small>{complex.location}</small><h3>{complex.name}</h3><p>{complex.note}</p></div><strong>{complex.price}<small>{complex.change}</small></strong><em>{complex.score}<small>점검도</small></em><b>→</b></button>)}
          {results.length === 0 && <p className="research-empty">조건에 맞는 단지가 없습니다. 지역 또는 단지명을 바꿔보세요.</p>}
        </div>
      </section>
      {selected && <section className="research-detail"><div><span>RESEARCH SNAPSHOT</span><h2>{selected.name}</h2><p>{selected.location} · {selected.area}</p><div className="research-links"><a href={selected.mapUrl} target="_blank" rel="noreferrer">지도에서 위치 보기 ↗</a><a href={selected.naverUrl} target="_blank" rel="noreferrer">네이버 부동산 가격 확인 ↗</a></div></div><div><article><small>가격 흐름</small><b>{selected.price} · {selected.change}</b></article><article><small>학군</small><b>{selected.school}</b></article><article><small>교통</small><b>{selected.transit}</b></article><article><small>다음 확인</small><b>최근 실거래 3건 비교</b></article></div></section>}
      <p className="tool-disclaimer">공개 데이터와 현장 확인을 함께 보세요. 이 도구는 투자 권유가 아닌 리서치 정리용입니다.</p>
    </main>
  );
}
