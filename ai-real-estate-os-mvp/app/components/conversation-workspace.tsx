"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import {
  analyzeInvestmentCase,
  applyFollowUp,
  EvidenceKind,
  intentLabels,
  InvestmentCase,
  Intent,
  parseInvestmentRequest,
  UserMode,
  WIRYE_SELL_SCENARIO,
} from "../conversation-engine";

type WorkspaceKind = "home" | "buy" | "sell" | "redevelopment" | "capture" | "automation";
type Props = { initialIntent?: Intent; compact?: boolean; kind?: WorkspaceKind };
type Attachment = { name: string; text: string; type: string };

const kindLabel: Record<EvidenceKind, string> = {
  user: "사용자 제공", ocr: "OCR 추출", official: "공식자료", ad: "광고문구",
  calculation: "계산값", estimate: "AI 추정", check: "확인 필요", sample: "예시 데이터",
};

const field = (label: string, item?: { value: unknown; kind: EvidenceKind; confidence: number; updated?: boolean }) => (
  <div className="fact-item" key={label}>
    <span>{label}</span><strong>{item?.value === undefined ? "확인 필요" : String(item.value)}</strong>
    <small className={`evidence ${item?.kind ?? "check"}`}>{item?.updated ? "후속 반영 · " : ""}{kindLabel[item?.kind ?? "check"]}{item ? ` · ${Math.round(item.confidence * 100)}%` : ""}</small>
  </div>
);

async function readPdf(buffer: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 30); pageNumber++) {
    const page = await pdf.getPage(pageNumber); const content = await page.getTextContent();
    pages.push(`[PDF ${pageNumber}쪽] ${content.items.map((item) => "str" in item ? item.str : "").join(" ")}`);
  }
  return pages.join("\n");
}

async function readImage(file: File) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("kor+eng", 1, { workerPath: "/ocr/worker.min.js", langPath: "/ocr/", corePath: "/ocr/" });
  try { return (await worker.recognize(file)).data.text; } finally { await worker.terminate(); }
}

export function ConversationWorkspace({ initialIntent, compact = false, kind = "home" }: Props) {
  const [mode, setMode] = useState<UserMode>("actual");
  const [text, setText] = useState("");
  const [conversation, setConversation] = useState<string[]>([]);
  const [data, setData] = useState<InvestmentCase | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const analysis = useMemo(() => data ? analyzeInvestmentCase(data) : null, [data]);

  const submitText = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    const withContext = attachments.length ? `${trimmed}\n${attachments.map((file) => file.text).join("\n")}` : trimmed;
    const parsed = data ? applyFollowUp(data, withContext) : parseInvestmentRequest(withContext);
    if (initialIntent && parsed.intent === "unknown") parsed.intent = initialIntent;
    setData(parsed);
    setConversation((items) => [...items, trimmed]);
    setText("");
  };

  const onSubmit = (event: FormEvent) => { event.preventDefault(); submitText(text); };
  const loadDemo = () => { setMode("demo"); setAttachments([]); setConversation([]); submitText(WIRYE_SELL_SCENARIO); };

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 5);
    setBusy(true);
    const parsed: Attachment[] = [];
    for (const file of files) {
      try {
        const lower = file.name.toLowerCase();
        if (file.type.startsWith("text/") || lower.endsWith(".csv")) {
          parsed.push({ name: file.name, type: "텍스트", text: await file.text() });
        } else if (file.type.startsWith("image/")) {
          parsed.push({ name: file.name, type: "이미지 OCR", text: await readImage(file) });
        } else if (lower.endsWith(".pdf")) {
          parsed.push({ name: file.name, type: "PDF 텍스트", text: await readPdf(await file.arrayBuffer()) });
        }
      } catch { parsed.push({ name: file.name, type: "확인 필요", text: `[읽기 실패: ${file.name}]` }); }
    }
    setAttachments((items) => [...items, ...parsed].slice(0, 5));
    setBusy(false);
    event.target.value = "";
  };

  return (
    <section className={`workspace ${compact ? "compact" : ""}`}>
      <div className="workspace-head">
        <div><span className="eyebrow">LOCAL-FIRST WORKSPACE</span><h2>{initialIntent ? intentLabels[initialIntent] : "무엇을 분석해볼까요?"}</h2><p>평소 말하듯 적거나 가지고 있는 캡처·PDF를 넣으세요. 중요한 빈칸만 다시 묻습니다.</p></div>
        <div className="mode-switch" aria-label="사용 모드">
          {(["actual", "demo", "student", "browse"] as UserMode[]).map((item) => <button className={mode === item ? "selected" : ""} onClick={() => setMode(item)} key={item}>{({actual:"실전",demo:"시연",student:"수강생",browse:"둘러보기"})[item]}</button>)}
        </div>
      </div>

      {!data && mode === "student" && <div className="lesson-strip"><strong>15분 실습</strong><span>1. 상황 한 문단 쓰기</span><span>2. AI 이해 카드 검토</span><span>3. 근거와 다음 행동 기록</span></div>}
      {!data && kind === "home" && <div className="starter-grid home-starters">
        <button onClick={() => setText("12억원 안에서 실거주할 아파트를 찾고 있어. 출퇴근과 입주시기를 같이 봐줘.")}><strong>내 상황부터 말하기</strong><span>예산·생활권·입주시기를 한 문장으로</span></button>
        <button onClick={() => setText("관심 있는 매물 캡처가 있어. 가격과 빠진 조건을 같이 확인해줘.")}><strong>관심 매물 검토하기</strong><span>설명이나 캡처에서 시작</span></button>
        <button onClick={() => setMode("student")}><strong>15분 실습으로 보기</strong><span>상황 설명 → 이해 확인 → 다음 행동</span></button>
      </div>}
      {!data && kind === "buy" && <div className="starter-grid buy-starters">
        <button onClick={() => setText("현금 5억과 대출을 합쳐 12억 안에서 실거주 아파트를 사고 싶어. 내년 2월 입주가 필요해.")}><strong>예산과 입주시기부터</strong><span>“12억 안에서 내년 2월 입주할 집을 찾고 있어.”</span></button>
        <button onClick={() => setText("관심 매물이 11.8억이야. 최근 실거래와 경쟁호가를 비교해서 협상 범위를 봐줘.")}><strong>관심 매물 가격부터</strong><span>“11.8억 매물의 협상 시작가와 상한가를 보고 싶어.”</span></button>
        <button onClick={() => setText("출퇴근 40분, 초등학교 도보권, 500세대 이상을 우선하고 싶어.")}><strong>생활 조건부터</strong><span>직장·교통·학교·필수조건을 평소 말하듯</span></button>
      </div>}
      {!data && kind === "sell" && <div className="starter-grid sell-starters single-feature">
        <button onClick={loadDemo}><strong>위례24단지 매도 시연</strong><span>16억 · 필로티 위 3층 · 동향 · 즉시입주 조건을 한 문단에서 읽어봅니다.</span><em>시연 불러오기 →</em></button>
      </div>}
      {!data && kind === "redevelopment" && <div className="starter-grid redevelopment-starters">
        <button onClick={() => setText("중개사에게 받은 재개발 매물 설명이야. 매매가는 7억2천이고 보증금 2억, 승계 가능한 대출은 아직 확인 못 했어. 필요한 현금과 확인 질문을 정리해줘.")}><strong>받은 설명 붙여넣기</strong><span>매매가·보증금·권리·사업단계를 말로 설명</span></button>
        <button onClick={() => fileRef.current?.click()}><strong>내 매물 캡처 올리기</strong><span>사용자가 직접 보유한 캡처 1~5장</span></button>
      </div>}
      {!data && (kind === "capture" || kind === "automation") && <div className="starter-grid"><button onClick={() => fileRef.current?.click()}><strong>{kind === "capture" ? "캡처 선택하기" : "자료 선택하기"}</strong><span>{kind === "capture" ? "개인정보를 가린 매물 캡처 1~5장" : "반복 업무에 쓰는 설명·문서부터 시작"}</span></button></div>}

      <div className="conversation" aria-live="polite">
        {conversation.map((message, index) => <div className="user-message" key={`${message}-${index}`}>{message}</div>)}
        {data && <>
          <article className="understanding-card">
            <div className="card-title"><div><span className="ai-dot">AI</span><strong>AI가 이렇게 이해했어요</strong></div><span className="confidence">목적 확신 {Math.round(data.intentConfidence * 100)}%</span></div>
            <div className="intent-pill">{intentLabels[data.intent]}</div>
            <div className="facts-grid">
              {field("단지", data.subject.complexName)}{field("평형/타입", data.subject.unitType)}{field("가격", data.subject.price ? {...data.subject.price, value: `${data.subject.price.value}억원`} : undefined)}
              {field("층", data.subject.floor ? {...data.subject.floor, value: `${data.subject.floor.value}층`} : undefined)}{field("층 조건", data.subject.floorType)}{field("향", data.subject.direction)}{field("입주", data.subject.occupancy)}
            </div>
            {data.comparables.length > 0 && <div className="comparable-list"><h3>비교 매물</h3>{data.comparables.map((item) => <div key={item.id}><strong>{item.price?.value}억원</strong><span>{item.floor?.value ? `${item.floor.value}층` : "층 확인 필요"}</span><span>{item.occupancy?.value ?? "입주 확인 필요"}</span>{item.availableDate && <span>{item.availableDate.value}</span>}{item.duplicateCandidate && <em>중복광고 후보</em>}</div>)}</div>}
            <details><summary>상세 입력값 검토·수정</summary><p>원문과 추출값을 비교해 잘못 이해한 부분만 아래 대화창에서 고쳐 말해주세요. 예: “가격은 15.8억이야.”</p><pre>{JSON.stringify(data, null, 2)}</pre></details>
          </article>
          {data.missingQuestions.length > 0 && <article className="question-card"><span className="eyebrow">결과를 크게 바꾸는 확인사항</span><ol>{data.missingQuestions.map((question) => <li key={question}>{question}</li>)}</ol></article>}
          {analysis && <article className="result-card">
            <div className="card-title"><div><span className="result-icon">✓</span><strong>분석 결과</strong></div><span className="evidence calculation">{kindLabel.calculation}</span></div>
            <h3>{analysis.headline}</h3><p>{analysis.conclusion}</p>
            {analysis.metrics.length > 0 && <div className="metric-grid">{analysis.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>)}</div>}
            <div className="reason-grid"><div><h4>판단 근거</h4><ul>{analysis.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div><div><h4>다음 행동</h4><ol>{analysis.nextActions.map((action) => <li key={action}>{action}</li>)}</ol></div></div>
            {analysis.scenarios.length > 0 && <div className="scenario-grid">{analysis.scenarios.map((scenario) => <div key={scenario.title}><span>{scenario.title}</span><strong>{scenario.value}</strong><small>{scenario.meaning}</small><em className={`evidence ${scenario.kind}`}>{kindLabel[scenario.kind]}</em></div>)}</div>}
            <p className="warning">확인 필요 · {analysis.warning} · 분석일 {new Date().toLocaleDateString("ko-KR")}</p>
          </article>}
        </>}
      </div>

      <form className="composer" onSubmit={onSubmit}>
        {attachments.length > 0 && <div className="attachment-row">{attachments.map((file) => <span key={file.name}>{file.type} · {file.name}</span>)}</div>}
        <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={data ? "조건을 바꿔 말해보세요. 예: 그럼 가격을 15.8억으로 바꾸면?" : "예: 우리 집을 16억에 내놨는데, 경쟁 매물과 비교해 적정한지 봐줘."} rows={3} />
        <div className="composer-actions"><div><button type="button" className="attach" onClick={() => fileRef.current?.click()}>＋ 자료 첨부</button><input ref={fileRef} type="file" accept="image/*,.pdf,.csv,.txt" multiple hidden onChange={onFiles}/><span>{busy ? "자료 읽는 중…" : "이미지·PDF·텍스트"}</span></div><button type="submit" className="send">분석하기 →</button></div>
      </form>
      <p className="privacy-note">자료는 이 브라우저에서만 처리하는 로컬 우선 설계입니다. 개인정보는 업로드 전에 가려주세요.</p>
    </section>
  );
}
