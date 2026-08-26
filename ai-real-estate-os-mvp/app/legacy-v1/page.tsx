"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  analyzePrice,
  duplicateIds,
  extractListingFields,
  formatEok,
  initialCash,
  totalInvestmentRange,
  type Comparable,
  type RedevelopmentCandidate,
  type SourceKind,
} from "../analysis";

type Module = "price" | "redevelopment" | "captures";
type CaptureItem = { id: string; name: string; url: string; file?: File; text: string; status: "ready" | "reading" | "done" | "error"; progress: number };

const TODAY = "2026-08-21";
const stages = ["전체", "추진준비", "구역지정", "조합설립인가", "사업시행인가", "관리처분인가", "착공"];

const sampleComparables: Comparable[] = [
  { id:"c1", name:"가상 한빛 84A", kind:"transaction", price:8.42, floor:"중층", occupancy:"실입주 확인", sourceKind:"sample", source:"국토부 실거래 형식의 익명화 샘플", checkedAt:TODAY, included:true },
  { id:"c2", name:"가상 한빛 84A", kind:"transaction", price:8.58, floor:"고층", occupancy:"입주조건 미확인", sourceKind:"sample", source:"국토부 실거래 형식의 익명화 샘플", checkedAt:TODAY, included:true },
  { id:"c3", name:"가상 한빛 84A", kind:"transaction", price:8.31, floor:"일반 저층", occupancy:"입주조건 미확인", sourceKind:"sample", source:"국토부 실거래 형식의 익명화 샘플", checkedAt:TODAY, included:true },
  { id:"c4", name:"가상 한빛 84A", kind:"asking", price:8.75, floor:"중층", occupancy:"즉시입주", sourceKind:"sample", source:"익명화 광고 샘플 A", checkedAt:TODAY, included:true },
  { id:"c5", name:"가상 한빛 84A", kind:"asking", price:8.9, floor:"고층", occupancy:"세안고", sourceKind:"sample", source:"익명화 광고 샘플 B", checkedAt:TODAY, included:false },
  { id:"c6", name:"가상 한빛 84A", kind:"asking", price:8.75, floor:"중층", occupancy:"즉시입주", sourceKind:"sample", source:"익명화 광고 샘플 C", checkedAt:TODAY, included:true },
];

const sampleCandidates: RedevelopmentCandidate[] = [
  { id:"r1", name:"가상 A구역 다가구", region:"서울 동북권", projectType:"재개발", stage:"구역지정", salePrice:7.2, officialPrice:.96, deposit:2.8, assumableLoan:.8, immediateCosts:.18, contributionLow:2.1, contributionHigh:3.2, yearsLow:6, yearsHigh:10, rightsStatus:"미확인", source:"익명화 강의 샘플 A", sourceKind:"sample", checkedAt:TODAY },
  { id:"r2", name:"가상 B구역 빌라", region:"서울 서남권", projectType:"재개발", stage:"조합설립인가", salePrice:5.9, officialPrice:1.14, deposit:1.7, assumableLoan:0, immediateCosts:.15, contributionLow:2.5, contributionHigh:3.6, yearsLow:5, yearsHigh:8, rightsStatus:"일부 확인", source:"익명화 강의 샘플 B", sourceKind:"sample", checkedAt:TODAY },
  { id:"r3", name:"가상 C아파트", region:"서울 동남권", projectType:"재건축(아파트)", stage:"사업시행인가", salePrice:9.1, officialPrice:1.68, deposit:4, assumableLoan:1.2, immediateCosts:.2, contributionLow:null, contributionHigh:null, yearsLow:4, yearsHigh:7, rightsStatus:"확인", source:"익명화 강의 샘플 C", sourceKind:"sample", checkedAt:TODAY },
];

const badgeLabels: Record<SourceKind,string> = { official:"공식 확인", user:"사용자 제공", ad:"광고 문구", calculation:"계산값", estimate:"AI 추정", expert:"전문가 의견", check:"확인 필요", sample:"샘플 데이터" };

function Badge({ kind, children }: { kind: SourceKind; children?: React.ReactNode }) {
  return <span className={`badge ${kind}`}>{children ?? badgeLabels[kind]}</span>;
}

function SourceLine({ source, checkedAt, kind = "user" }: { source:string; checkedAt:string; kind?:SourceKind }) {
  return <div className="source-line"><Badge kind={kind}/><span>{source}</span><span>확인일 {checkedAt || "미입력"}</span></div>;
}

function PriceTool() {
  const [mode,setMode] = useState<"buy"|"sell">("buy");
  const [comparables,setComparables] = useState(sampleComparables);
  const [draft,setDraft] = useState({ name:"", kind:"asking" as "asking"|"transaction", price:"", floor:"중층", occupancy:"확인 필요", source:"사용자 직접 입력", checkedAt:TODAY });
  const result = useMemo(() => analyzePrice(comparables,mode),[comparables,mode]);
  const duplicates = useMemo(() => duplicateIds(comparables),[comparables]);

  const addComparable = () => {
    const price = Number(draft.price);
    if (!draft.name.trim() || !price) return;
    setComparables((items) => [...items,{ id:crypto.randomUUID(), name:draft.name.trim(), kind:draft.kind, price, floor:draft.floor, occupancy:draft.occupancy, sourceKind:draft.kind === "asking" ? "ad" : "user", source:draft.source || "출처 미확인", checkedAt:draft.checkedAt, included:true }]);
    setDraft((value) => ({...value,name:"",price:""}));
  };

  return <section className="tool-panel">
    <div className="panel-heading"><div><span className="section-label">아파트 적정가격 분석</span><h3>호가와 실거래를 섞지 않고 보기</h3></div><div className="mode-switch"><button className={mode==="buy"?"selected":""} onClick={()=>setMode("buy")}>매수</button><button className={mode==="sell"?"selected":""} onClick={()=>setMode("sell")}>매도</button></div></div>
    <div className="notice-strip"><Badge kind="calculation"/><p>가격은 투자 추천이 아니라 비교자료 기반 검토 구간입니다. 표본이 적으면 계산을 중단합니다.</p></div>

    <div className="split-layout">
      <div className="input-card">
        <div className="card-title"><div><span>비교자료 추가</span><h4>매물·실거래 한 줄 입력</h4></div><small>단위: 억원</small></div>
        <div className="form-grid">
          <label className="wide"><span>단지·평형</span><input value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})} placeholder="예: 가상 한빛 84A"/></label>
          <label><span>자료 종류</span><select value={draft.kind} onChange={(e)=>setDraft({...draft,kind:e.target.value as "asking"|"transaction"})}><option value="asking">현재 호가</option><option value="transaction">최근 실거래</option></select></label>
          <label><span>가격</span><div className="unit-input"><input inputMode="decimal" value={draft.price} onChange={(e)=>setDraft({...draft,price:e.target.value.replace(/[^0-9.]/g,"")})}/><b>억</b></div></label>
          <label><span>층 구분</span><select value={draft.floor} onChange={(e)=>setDraft({...draft,floor:e.target.value})}><option>1층</option><option>필로티</option><option>일반 저층</option><option>중층</option><option>고층</option></select></label>
          <label><span>입주조건</span><select value={draft.occupancy} onChange={(e)=>setDraft({...draft,occupancy:e.target.value})}><option>즉시입주</option><option>세안고</option><option>실입주 확인</option><option>확인 필요</option></select></label>
          <label className="wide"><span>출처</span><input value={draft.source} onChange={(e)=>setDraft({...draft,source:e.target.value})}/></label>
          <label><span>확인일</span><input type="date" value={draft.checkedAt} onChange={(e)=>setDraft({...draft,checkedAt:e.target.value})}/></label>
        </div>
        <button className="primary-button" onClick={addComparable}>＋ 비교자료에 추가</button>
      </div>

      <div className="result-summary">
        <div className="band-card"><div><span>실거래 가격대</span><Badge kind="calculation"/></div>{result.transaction?<><strong>{formatEok(result.transaction.low)} — {formatEok(result.transaction.high)}</strong><small>중앙 {formatEok(result.transaction.median)} · {result.transaction.method} · {result.transaction.count}건</small></>:<strong className="empty-value">자료 부족</strong>}</div>
        <div className="band-card"><div><span>현재 호가 가격대</span><Badge kind="calculation"/></div>{result.asking?<><strong>{formatEok(result.asking.low)} — {formatEok(result.asking.high)}</strong><small>중앙 {formatEok(result.asking.median)} · {result.asking.method} · {result.asking.count}건</small></>:<strong className="empty-value">자료 부족</strong>}</div>
        <div className="signal-card"><Badge kind="estimate"/><p>{result.signal}</p></div>
      </div>
    </div>

    {result.review && <div className="review-band">
      <div className="review-intro"><Badge kind="calculation"/><strong>{mode==="buy"?"매수 가격 검토 구간":"매도 가격 검토 구간"}</strong><small>공식 v1 · 포함 자료만 사용</small></div>
      <div><span>{mode==="buy"?"협상 시작 검토가":"가격 재검토선"}</span><b>{formatEok(result.review.first)}</b></div><div><span>목표 검토가</span><b>{formatEok(result.review.target)}</b></div><div><span>{mode==="buy"?"상한 검토가":"상단 호가"}</span><b>{formatEok(result.review.limit)}</b></div>
    </div>}

    <div className="table-section"><div className="section-head"><div><h4>비교자료 {comparables.length}건</h4><span>체크된 자료만 계산</span></div><div className="legend"><Badge kind="official"/><Badge kind="ad"/><Badge kind="check"/></div></div>
      <div className="data-table price-table"><div className="table-row table-header"><span>포함</span><span>자료</span><span>가격</span><span>층·입주</span><span>출처·확인일</span></div>{comparables.map((item)=><div className={`table-row ${!item.included?"excluded":""}`} key={item.id}><span><input aria-label={`${item.name} 계산 포함`} type="checkbox" checked={item.included} onChange={()=>setComparables((rows)=>rows.map((row)=>row.id===item.id?{...row,included:!row.included}:row))}/></span><span><b>{item.name}</b><small>{item.kind==="asking"?"현재 호가":"최근 실거래"} {duplicates.has(item.id)&&<em>중복 광고 후보</em>}</small></span><span><b>{formatEok(item.price)}</b><small><Badge kind={item.sourceKind}/></small></span><span>{item.floor}<small>{item.occupancy}</small></span><span>{item.source}<small>확인일 {item.checkedAt}</small></span></div>)}</div>
    </div>
  </section>;
}

function RedevelopmentTool() {
  const [budget,setBudget] = useState(4);
  const [stage,setStage] = useState("전체");
  const [projectType,setProjectType] = useState("전체");
  const [officialUnderOne,setOfficialUnderOne] = useState(false);
  const [candidates,setCandidates] = useState(sampleCandidates);
  const [draft,setDraft] = useState({name:"",region:"",projectType:"재개발",stage:"추진준비",salePrice:"",officialPrice:"",deposit:"",loan:"",costs:"",source:"사용자 직접 입력",checkedAt:TODAY});
  const results = useMemo(()=>candidates.map((candidate)=>({candidate,cash:initialCash(candidate),total:totalInvestmentRange(candidate)})).filter(({candidate,cash})=>cash.value<=budget&&(stage==="전체"||candidate.stage===stage)&&(projectType==="전체"||candidate.projectType===projectType)&&(!officialUnderOne||(candidate.officialPrice!==null&&candidate.officialPrice<=1))).sort((a,b)=>a.cash.value-b.cash.value),[budget,stage,projectType,officialUnderOne,candidates]);
  const addCandidate = () => {
    const salePrice=Number(draft.salePrice); if(!draft.name.trim()||!salePrice)return;
    const nullable=(value:string)=>value===""?null:Number(value);
    setCandidates((items)=>[...items,{id:crypto.randomUUID(),name:draft.name,region:draft.region||"지역 확인 필요",projectType:draft.projectType,stage:draft.stage,salePrice,officialPrice:nullable(draft.officialPrice),deposit:nullable(draft.deposit),assumableLoan:nullable(draft.loan),immediateCosts:nullable(draft.costs),contributionLow:null,contributionHigh:null,yearsLow:0,yearsHigh:0,rightsStatus:"미확인",source:draft.source||"출처 미확인",sourceKind:"user",checkedAt:draft.checkedAt}]);
    setDraft({...draft,name:"",salePrice:"",officialPrice:"",deposit:"",loan:"",costs:""});
  };
  return <section className="tool-panel">
    <div className="panel-heading"><div><span className="section-label">재개발·재건축 후보 스크리너</span><h3>내 초투 안에서 먼저 찾기</h3></div><button className="reset-button" onClick={()=>{setBudget(4);setStage("전체");setProjectType("전체");setOfficialUnderOne(false)}}>↻ 초기화</button></div>
    <div className="budget-hero"><div><span>가용 초기투자금</span><strong>{formatEok(budget)}</strong><small>매매가 − 승계보증금 − 확인된 승계대출 + 즉시 부대비용</small></div><input aria-label="가용 초기투자금" type="range" min="1" max="15" step=".1" value={budget} onChange={(e)=>setBudget(Number(e.target.value))}/></div>
    <div className="quick-filters"><button onClick={()=>setBudget(4)}>초투 4억 이하</button><button className={officialUnderOne?"active":""} onClick={()=>setOfficialUnderOne((value)=>!value)}>공시가 1억 이하</button><button onClick={()=>setStage("추진준비")}>초기 재개발</button><button onClick={()=>setStage("조합설립인가")}>중기 재개발</button></div>
    <div className="filter-block"><div className="filter-label">사업종류</div><div className="chip-row">{["전체","재개발","재건축(아파트)"].map((item)=><button key={item} className={projectType===item?"selected":""} onClick={()=>setProjectType(item)}>{item}</button>)}</div></div>
    <div className="filter-block"><div className="filter-label">진행단계</div><div className="chip-row">{stages.map((item)=><button key={item} className={stage===item?"selected":""} onClick={()=>setStage(item)}>{item}</button>)}</div></div>
    <details className="add-details"><summary>＋ 내 후보 직접 입력</summary><div className="form-grid compact">
      <label className="wide"><span>후보명</span><input value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})}/></label><label><span>지역</span><input value={draft.region} onChange={(e)=>setDraft({...draft,region:e.target.value})}/></label><label><span>사업종류</span><select value={draft.projectType} onChange={(e)=>setDraft({...draft,projectType:e.target.value})}><option>재개발</option><option>재건축(아파트)</option></select></label><label><span>진행단계</span><select value={draft.stage} onChange={(e)=>setDraft({...draft,stage:e.target.value})}>{stages.slice(1).map((item)=><option key={item}>{item}</option>)}</select></label>
      {[["salePrice","매매가"],["officialPrice","공시가격"],["deposit","승계보증금"],["loan","승계대출"],["costs","즉시 부대비용"]].map(([key,label])=><label key={key}><span>{label}</span><div className="unit-input"><input inputMode="decimal" value={draft[key as keyof typeof draft]} onChange={(e)=>setDraft({...draft,[key]:e.target.value.replace(/[^0-9.]/g,"")})}/><b>억</b></div></label>)}
      <label className="wide"><span>출처</span><input value={draft.source} onChange={(e)=>setDraft({...draft,source:e.target.value})}/></label><label><span>확인일</span><input type="date" value={draft.checkedAt} onChange={(e)=>setDraft({...draft,checkedAt:e.target.value})}/></label>
    </div><button className="primary-button" onClick={addCandidate}>후보 추가</button></details>
    <div className="result-head"><div><strong>조건 안의 후보</strong><span>{results.length}개</span></div><small>초투 낮은 순 ↓</small></div>
    <div className="candidate-list">{results.length===0?<div className="empty-state"><strong>현재 조건에 맞는 후보가 없습니다.</strong><span>예산이나 진행단계를 넓히되, 누락값을 0원으로 가정하지 않았는지 확인하세요.</span></div>:results.map(({candidate,cash,total})=><article className="candidate-card" key={candidate.id}>
      <div className="candidate-main"><div className="candidate-title"><span>{candidate.region} · {candidate.projectType}</span><h4>{candidate.name}</h4></div><div className="cash"><span>계약 시 필요현금</span><strong>{formatEok(cash.value)}</strong></div></div>
      <div className="metrics four"><div><span>매매가</span><b>{formatEok(candidate.salePrice)}</b></div><div><span>공시가격</span><b>{formatEok(candidate.officialPrice)}</b></div><div><span>진행단계</span><b>{candidate.stage}</b></div><div><span>권리 검토</span><b>{candidate.rightsStatus}</b></div></div>
      <div className="funding-line"><div><span>예상 총투</span><b>{total?`${formatEok(total.low)} ~ ${formatEok(total.high)}`:"분담금 확인 필요"}</b></div><div><span>예상 기간</span><b>{candidate.yearsLow||candidate.yearsHigh?`${candidate.yearsLow}~${candidate.yearsHigh}년`:"확인 필요"}</b></div></div>
      {cash.missing.length>0&&<div className="warning-box"><Badge kind="check"/><span>{cash.missing.join("·")} 미입력 — 현재 초투는 임시 계산입니다.</span></div>}
      <SourceLine source={candidate.source} checkedAt={candidate.checkedAt} kind={candidate.sourceKind}/>
    </article>)}</div>
  </section>;
}

function CaptureTool() {
  const [captures,setCaptures] = useState<CaptureItem[]>([]);
  const [selectedId,setSelectedId] = useState<string>("");
  const [fallback,setFallback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = captures.find((item)=>item.id===selectedId) ?? captures[0];
  const selectedFields = selected ? extractListingFields(selected.text) : null;

  const addFiles = (event:ChangeEvent<HTMLInputElement>) => {
    const files=Array.from(event.target.files??[]).filter((file)=>file.type.startsWith("image/"));
    const next=files.map((file)=>({id:crypto.randomUUID(),name:file.name,url:URL.createObjectURL(file),file,text:"",status:"ready" as const,progress:0}));
    setCaptures((items)=>[...items,...next]); if(!selectedId&&next[0])setSelectedId(next[0].id); event.target.value="";
  };
  const addFallback = () => {
    if(!fallback.trim())return; const item={id:crypto.randomUUID(),name:"텍스트 백업",url:"",text:fallback.trim(),status:"done" as const,progress:1}; setCaptures((items)=>[...items,item]);setSelectedId(item.id);setFallback("");
  };
  const runOcr = async () => {
    const targets=captures.filter((item)=>item.file&&item.status!=="done"); if(!targets.length)return;
    try {
      const {createWorker}=await import("tesseract.js");
      const worker=await createWorker("kor+eng",1,{workerPath:"/ocr/worker.min.js",langPath:"/ocr/",corePath:"/ocr/",logger:(message)=>{if(message.status==="recognizing text")setCaptures((items)=>items.map((item)=>item.status==="reading"?{...item,progress:message.progress}:item))}});
      for(const target of targets){setCaptures((items)=>items.map((item)=>item.id===target.id?{...item,status:"reading",progress:0}:item));const result=await worker.recognize(target.file!);setCaptures((items)=>items.map((item)=>item.id===target.id?{...item,status:"done",progress:1,text:result.data.text}:item));}
      await worker.terminate();
    } catch { setCaptures((items)=>items.map((item)=>item.status==="reading"?{...item,status:"error"}:item)); }
  };
  const updateText=(id:string,text:string)=>setCaptures((items)=>items.map((item)=>item.id===id?{...item,text,status:"done"}:item));
  const parsed=captures.filter((item)=>item.text.trim()).map((item)=>({item,fields:extractListingFields(item.text)}));
  const missing = selectedFields ? [["매매가",selectedFields.salePrice],["임대보증금",selectedFields.deposit],["표시 초투",selectedFields.initial],["공시가격",selectedFields.officialPrice],["대지지분",selectedFields.landShare],["진행단계",selectedFields.stage]].filter(([,value])=>value===null).map(([label])=>label as string) : [];
  const computedInitial=selectedFields && selectedFields.salePrice!==null && selectedFields.deposit!==null ? selectedFields.salePrice-selectedFields.deposit : null;
  return <section className="tool-panel">
    <div className="panel-heading"><div><span className="section-label">매물 캡처 비교</span><h3>여러 장을 올리고, 빠진 정보부터 찾기</h3></div><span className="local-pill">이미지 외부 전송 없음</span></div>
    <div className="upload-zone" onClick={()=>inputRef.current?.click()}><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={addFiles}/><div className="upload-mark">＋</div><div><strong>매물 캡처 여러 장 선택</strong><span>PNG·JPG·WebP · OCR은 이 브라우저에서 처리</span></div></div>
    <div className="capture-actions"><button className="primary-button" disabled={!captures.some((item)=>item.file&&item.status!=="done")} onClick={runOcr}>문자 읽기 시작</button><span>한국어·영어 OCR 모델이 앱에 포함되어 인터넷 없이 작동합니다.</span></div>
    <details className="fallback-box"><summary>이미지 업로드가 안 되나요? 텍스트로 붙여넣기</summary><textarea value={fallback} onChange={(e)=>setFallback(e.target.value)} placeholder="구역명, 매매가, 임대보증금, 초투, 대지지분, 사업단계 등을 붙여넣으세요."/><button onClick={addFallback}>텍스트 분석에 추가</button></details>
    {captures.length>0&&<div className="capture-workspace"><aside className="capture-list">{captures.map((item)=><button key={item.id} className={selected?.id===item.id?"selected":""} onClick={()=>setSelectedId(item.id)}>{item.url?<img src={item.url} alt=""/>:<span className="text-thumb">TXT</span>}<span><b>{item.name}</b><small>{item.status==="reading"?`읽는 중 ${Math.round(item.progress*100)}%`:item.status==="done"?"내용 확인 필요":item.status==="error"?"OCR 실패":"대기"}</small></span></button>)}</aside>
      {selected&&<div className="capture-editor"><div className="editor-head"><div><h4>{selected.name}</h4><span>OCR 원문을 캡처와 대조한 뒤 수정하세요.</span></div><Badge kind="user">사용자 확인 전</Badge></div>{selected.url&&<img className="capture-preview" src={selected.url} alt={`${selected.name} 미리보기`}/>}<textarea value={selected.text} onChange={(e)=>updateText(selected.id,e.target.value)} placeholder="OCR 결과가 여기에 표시됩니다. 직접 입력해도 됩니다."/></div>}
    </div>}
    {parsed.length>0&&<><div className="table-section"><div className="section-head"><div><h4>캡처 비교표</h4><span>{parsed.length}개</span></div><Badge kind="check">원문 대조 필요</Badge></div><div className="data-table capture-table"><div className="table-row table-header"><span>매물</span><span>매매가</span><span>보증금</span><span>초투</span><span>공시가</span><span>단계</span></div>{parsed.map(({item,fields})=><div className="table-row" key={item.id}><span><b>{item.name}</b></span><span>{formatEok(fields.salePrice)}</span><span>{formatEok(fields.deposit)}</span><span>{formatEok(fields.initial)}</span><span>{formatEok(fields.officialPrice)}</span><span>{fields.stage??"확인 필요"}</span></div>)}</div></div>
      {selectedFields&&<div className="six-grid">
        <article><Badge kind="user"/><h4>1. 확인된 사실 후보</h4><p>매매가 {formatEok(selectedFields.salePrice)} · 단계 {selectedFields.stage??"미확인"} · 대지지분 {selectedFields.landShare??"미확인"}</p><small>캡처 원문과 사용자가 대조해야 확정됩니다.</small></article>
        <article><Badge kind="calculation"/><h4>2. 계산 가능한 값</h4><p>매매가−보증금 기준 현금 {formatEok(computedInitial)}</p><small>취득비용·대출·분담금은 포함되지 않았습니다.</small></article>
        <article><Badge kind="check"/><h4>3. 누락 정보</h4><p>{missing.length?missing.join(" · "):"핵심 추출 필드는 채워졌습니다."}</p><small>비어 있는 값을 0으로 간주하지 않습니다.</small></article>
        <article><Badge kind="check"/><h4>4. 권리·법률 위험</h4><p>분양자격 · 권리산정기준일 · 조합원 지위양도 · 현금청산 · 토지거래허가</p><small>캡처 광고만으로 판정하지 않습니다.</small></article>
        <article><Badge kind="estimate"/><h4>5. 사업성·가격 가정</h4><p>예상 분담금 {formatEok(selectedFields.contribution)} · 주변 신축 비교값 미입력</p><small>약세·기준·강세 시나리오는 추가 근거 입력 후 계산합니다.</small></article>
        <article><Badge kind="check"/><h4>6. 확인할 기관과 질문</h4><p>중개사: 승계조건 원문? · 조합: 분양자격 확인서? · 구청: 권리산정일과 허가 조건?</p><small>계약 전 등기·공식문서·전문가 확인이 필요합니다.</small></article>
      </div>}</>}
  </section>;
}

export default function Home(){
  const [active,setActive]=useState<Module>("redevelopment");
  const exportGuide=()=>{const payload={app:"집값연구소",exportedAt:new Date().toISOString(),principles:["호가와 실거래 분리","누락값은 0원으로 확정하지 않음","출처와 확인일 필수","최종 판단은 사용자"],version:1};const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));link.download=`집값연구소-데이터원칙-${TODAY}.json`;link.click();URL.revokeObjectURL(link.href)};
  return <main className="app-shell">
    <header className="topbar"><div><span className="product-kicker">LOCAL INVESTMENT DESK</span><h1>집값연구소</h1></div><div className="top-actions"><button onClick={exportGuide}>데이터 원칙 저장</button><span className="local-pill">● 내 기기에서만 처리</span></div></header>
    <section className="hero"><div><span className="section-label">AI 부동산 투자 OS</span><h2>살지 말지보다,<br/>무엇을 확인할지 먼저.</h2><p>호가·실거래·계산·추정을 분리해 비교하고, 누락된 근거를 질문으로 돌려드립니다.</p></div><div className="hero-status"><strong>{TODAY.replaceAll("-",".")}</strong><span>샘플 데이터 기준일</span></div></section>
    <nav className="module-nav" aria-label="분석 도구"><button className={active==="price"?"active":""} onClick={()=>setActive("price")}><span>01</span><strong>적정가격</strong><small>매수·매도 분석</small></button><button className={active==="redevelopment"?"active":""} onClick={()=>setActive("redevelopment")}><span>02</span><strong>초투 찾기</strong><small>재개발 후보</small></button><button className={active==="captures"?"active":""} onClick={()=>setActive("captures")}><span>03</span><strong>캡처 비교</strong><small>여러 장 분석</small></button></nav>
    {active==="price"?<PriceTool/>:active==="redevelopment"?<RedevelopmentTool/>:<CaptureTool/>}
    <footer><strong>판단은 사람에게 남겨둡니다.</strong><p>이 앱은 투자·법률·세무 자문이 아닙니다. 광고 문구와 OCR 결과는 공식자료 및 관계기관을 통해 다시 확인하세요.</p><div><Badge kind="official"/><Badge kind="user"/><Badge kind="ad"/><Badge kind="calculation"/><Badge kind="estimate"/><Badge kind="expert"/><Badge kind="check"/><Badge kind="sample"/></div></footer>
  </main>;
}
