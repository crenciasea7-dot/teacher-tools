"use client";

import { useState } from "react";

type Project = { name: string; type: "재건축" | "재개발"; district: string; place: string; stage: string; grade: "매우 임박" | "관심" | "주의" | "경계" | "확정"; document: string; date: string; regulation: string; reason: string; review?: boolean };
const projects: Project[] = [
  { name: "목동신시가지 7단지", type: "재건축", district: "양천구", place: "서울 양천구 목동", stage: "추진위원회 승인", grade: "관심", document: "조합설립 동의서 징구 안내", date: "2026-08-12", regulation: "토지거래허가구역", reason: "추진위 승인 이후 동의서 관련 문서가 확인됨" },
  { name: "잠실주공 5단지", type: "재건축", district: "송파구", place: "서울 송파구 잠실동", stage: "추진위원회 승인", grade: "주의", document: "조합설립 동의율 및 접수현황 공개", date: "2026-08-12", regulation: "규제 상태 미확인", reason: "동의서 접수현황 또는 동의율 자료가 확인됨" },
  { name: "개포주공 5단지", type: "재건축", district: "강남구", place: "서울 강남구 개포동", stage: "추진위원회 승인", grade: "경계", document: "창립총회 개최 공고", date: "2026-08-12", regulation: "토지거래허가구역", reason: "창립총회·임원선출·정관안 중 공식 문서가 확인됨" },
  { name: "아현2구역", type: "재개발", district: "마포구", place: "서울 마포구 아현동", stage: "사업시행인가", grade: "매우 임박", document: "관리처분계획인가 신청 공고", date: "2026-08-13", regulation: "규제 상태 미확인", reason: "관리처분계획인가 신청 또는 공람공고가 확인됨" },
  { name: "성수전략정비구역 3지구", type: "재개발", district: "성동구", place: "서울 성동구 성수동1가", stage: "관리처분인가", grade: "확정", document: "관리처분계획인가 고시", date: "2026-08-11", regulation: "규제 상태 미확인", reason: "정보몽땅 공식 단계 또는 인가 고시가 확인됨" },
  { name: "영등포 역세권 정비구역", type: "재개발", district: "영등포구", place: "서울 영등포구 영등포동", stage: "사업시행인가", grade: "주의", document: "종전자산 감정평가 안내", date: "2026-08-12", regulation: "규제 상태 미확인", reason: "분양신청 또는 감정평가·종전자산 절차가 확인됨", review: true },
];

export default function Home() {
  const [tab, setTab] = useState("대시보드");
  const [selected, setSelected] = useState<Project | null>(null);
  const [manual, setManual] = useState("");
  const visible = tab === "알림" ? projects.filter((project) => project.grade === "매우 임박" || project.grade === "경계") : tab === "사업장" ? projects : projects;
  return <main>
    <header><div className="brand"><span>R</span><div><b>인가 레이더 서울</b><small>공식 공개자료 기반 사전 점검</small></div></div><nav>{["대시보드", "사업장", "알림", "수동 등록"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav></header>
    <div className="notice">참고용 정보입니다. 계약 전 관할 구청 정비사업 부서 및 중개사·법률/세무 전문가에게 최종 확인이 필요합니다. ‘임박’은 인가일을 보장하거나 예측하지 않습니다.</div>
    {tab === "수동 등록" ? <section className="manual"><p className="eyebrow">MANUAL RECORD</p><h1>새 사업장을 메모하세요.</h1><p>공식 문서 링크와 확인일을 함께 남기면 다음 검토 때 근거로 활용할 수 있습니다.</p><textarea value={manual} onChange={(event) => setManual(event.target.value)} placeholder="예: 사업장명 / 관할구 / 공식 공고 제목 / 원문 링크 / 확인일" /><button onClick={() => setManual("")}>임시 메모 저장 <span>→</span></button></section> : <>
      <section className="hero"><p className="eyebrow">SEOUL URBAN RENEWAL INTELLIGENCE · SAMPLE DATA</p><h1>인가 전 확인하는<br /><em>공식 신호</em></h1><p>모든 등급은 문서 원문·게시기관·게시일을 근거로 표시합니다.</p><div className="stats"><Stat value="7" label="서울 전체 표본 사업장" /><Stat value="3" label="재건축 위험 신호" /><Stat value="3" label="재개발 위험 신호" /><Stat value="1" label="규제지역 · 경계 이상" /></div></section>
      <section className="board"><div className="main-list"><div className="section-head"><div><p className="eyebrow">SIGNAL FEED</p><h2>{tab === "알림" ? "우선 확인할 신호" : "최근 7일 등급 상향 / 재검토 필요"}</h2></div><span>{visible.length}건</span></div>{visible.map((project) => <button className="project" key={project.name} onClick={() => setSelected(project)}><div className="type">{project.type}</div><div className="project-name"><h3>{project.name}</h3><p>{project.district} · {project.place} · {project.stage}</p></div><span className={`grade ${project.grade}`}>{project.grade}</span><div className="document"><b>{project.document}</b><p>{project.date} · {project.regulation} · {project.reason}</p></div><i>→</i></button>)}</div>
        <aside className="integrity"><p className="eyebrow">DATA INTEGRITY</p><h2>무결성 상태</h2><p>경계 이상은 필수 항목을 갖춘 공식 문서가 있어야만 표시됩니다.</p><p>자동 하향은 하지 않으며, 상충·취소 신호는 재검토 필요로 분리합니다.</p><div><b>재검토 필요</b><strong>{projects.filter((project) => project.review).length}건</strong></div></aside></section>
      {selected && <section className="drawer"><div><p className="eyebrow">DOCUMENT SNAPSHOT</p><h2>{selected.type} {selected.name}</h2><p>{selected.place} · {selected.stage}</p></div><div><span className={`grade grade-${selected.grade.replace(" ", "")}`}>{selected.grade}</span><b>{selected.document}</b><p>{selected.reason}</p><small>확인일 {selected.date} · {selected.regulation}</small></div><button onClick={() => setSelected(null)}>닫기 ×</button></section>}
    </>}
  </main>;
}
function Stat({ value, label }: { value: string; label: string }) { return <article><b>{value}</b><span>{label}</span></article>; }
