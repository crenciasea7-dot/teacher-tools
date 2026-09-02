"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ResearchAnalysis, ResearchRecord } from "./types";

const DB_NAME = "ai-invest-research";
const STORE_NAME = "documents";
const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" });

const toolLinks: Record<string, string> = {
  "주간 아파트 가격동향": "https://rone-weekly-capital-dashboard.vercel.app/",
  "주간 아파트 가격동향 그래프": "https://rone-weekly-capital-dashboard.vercel.app/",
  "보유세 계산기": "/property-tax",
  "구매력 계산기": "https://purchasing-power-calculator.vercel.app/",
  "집중 아파트 비교 리서치": "https://jipjung-apartment-research.crenciasea7.chatgpt.site/",
  "토탈 비용 시뮬레이션": "/property-purchase-simulation",
  "비트코인 참고 지표": "/bitcoin-indicators",
};

const impactLabels = {
  salePrice: "매매가",
  loan: "대출 조건",
  tax: "세금",
  policy: "정책",
  sentiment: "시장심리",
};

const stopWords = new Set(["그리고", "그러나", "대한", "위한", "관련", "통해", "이번", "현재", "경우", "자료", "분석", "시장", "있다", "있는", "하는", "했다", "된다", "따라", "대해", "것으로", "에서", "으로", "이라고", "또한", "보다", "까지"]);
const MIN_READABLE_TEXT_LENGTH = 40;
const FEATURE_DISABLED = true;
const OCR_OPTIONS = {
  workerPath: "/ocr/worker.min.js",
  langPath: "/ocr/",
  corePath: "/ocr/tesseract-core-simd-lstm.wasm.js",
};

async function createOcrWorker() {
  const { createWorker } = await import("tesseract.js");
  try {
    return await createWorker("kor+eng", 1, OCR_OPTIONS);
  } catch {
    return createWorker("kor+eng");
  }
}

type OcrWorker = Awaited<ReturnType<typeof createOcrWorker>>;

async function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PDF 페이지를 이미지로 변환하지 못했습니다.")), "image/png");
  });
}

async function recognizeImage(source: File | Blob | HTMLCanvasElement, worker?: OcrWorker) {
  const activeWorker = worker ?? await createOcrWorker();
  try {
    const image = source instanceof HTMLCanvasElement ? await canvasToBlob(source) : source;
    const result = await activeWorker.recognize(image);
    return result.data.text;
  } finally {
    if (!worker) await activeWorker.terminate();
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "자료를 분석하지 못했습니다.");
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getRecords(): Promise<ResearchRecord[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as ResearchRecord[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

async function putRecord(record: ResearchRecord) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function removeRecord(id: string) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function extractText(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (["txt", "md", "csv", "json", "html", "htm"].includes(extension ?? "") || file.type.startsWith("text/")) {
    return file.text();
  }
  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
    }
    const embeddedText = pages.join("\n\n").trim();
    if (embeddedText.length >= MIN_READABLE_TEXT_LENGTH) return embeddedText;

    const ocrPages: string[] = [];
    const maxPages = Math.min(pdf.numPages, 12);
    const worker = await createOcrWorker();
    try {
      for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2.4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) continue;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const pageText = await recognizeImage(canvas, worker);
        if (pageText.trim()) ocrPages.push(pageText);
        canvas.width = 1;
        canvas.height = 1;
        if (ocrPages.join("\n").trim().length >= 2_500 && pageNumber >= 3) break;
      }
    } finally {
      await worker.terminate();
    }
    return ocrPages.join("\n\n").trim();
  }
  if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(extension ?? "")) {
    const text = await recognizeImage(file);
    if (!text.trim()) throw new Error("텍스트 인식에 실패했습니다.");
    return text;
  }
  throw new Error("이미지(PNG/JPG), PDF, DOCX, TXT, MD, CSV, JSON 파일을 지원합니다.");
}

function localKeywords(text: string) {
  const words = text.match(/[가-힣A-Za-z0-9]{2,}/g) ?? [];
  const frequency = new Map<string, number>();
  words.forEach((raw) => {
    const word = raw.toLowerCase();
    if (!stopWords.has(word) && !/^\d+$/.test(word)) frequency.set(word, (frequency.get(word) ?? 0) + 1);
  });
  const ranked = [...frequency].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const max = ranked[0]?.[1] ?? 1;
  return ranked.map(([word, count]) => ({ word, weight: Math.max(1, Math.round((count / max) * 10)) }));
}

function localAnalysis(text: string, title: string): ResearchAnalysis {
  const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?다요])\s+/).filter((sentence) => sentence.length > 18);
  const keywords = localKeywords(text);
  const has = (pattern: RegExp) => pattern.test(text);
  const affected = (pattern: RegExp, detail: string) => ({ direction: has(pattern) ? "uncertain" as const : "neutral" as const, detail: has(pattern) ? detail : "이 자료만으로 직접적인 변화는 확인되지 않습니다." });
  return {
    summary: (sentences.slice(0, 3).join(" ") || `${title} 자료의 핵심 내용을 확인했습니다.`).slice(0, 420),
    insights: sentences.slice(0, 4).map((sentence) => sentence.slice(0, 180)),
    keywords,
    impact: {
      salePrice: affected(/매매|가격|거래|주택|아파트/, "가격과 거래량 관련 신호가 있어 지역·단지별 실제 거래 확인이 필요합니다."),
      loan: affected(/대출|금리|LTV|DSR|DTI|은행/, "대출 한도 또는 이자 부담에 영향을 줄 수 있어 금융 조건을 다시 계산해야 합니다."),
      tax: affected(/세금|세제|취득세|보유세|양도세/, "세금 관련 내용이 포함되어 적용 시점과 본인 조건 확인이 필요합니다."),
      policy: affected(/정책|정부|규제|법안|발표/, "정책 변화 신호가 있어 시행일과 적용 대상을 원문에서 확인해야 합니다."),
      sentiment: affected(/심리|관망|수요|공급|상승|하락/, "시장심리에 영향을 줄 표현이 있어 다음 통계와 거래 흐름을 함께 봐야 합니다."),
    },
    perspectives: {
      positive: "기회가 될 수 있는 변화와 수혜 대상을 찾되 실제 수치로 확인해야 합니다.",
      negative: "비용 증가·규제·수요 위축 가능성과 예상이 빗나갈 때의 손실을 먼저 점검해야 합니다.",
      neutral: "자료 하나로 결론내리지 말고 시행 여부와 다음 공식 통계를 기다리는 편이 안전합니다.",
    },
    actions: ["원문의 발표일·시행일·적용 대상을 다시 확인하세요.", "내 보유자산과 관심 지역에 직접 적용되는 문장을 표시하세요.", "다음 주 공식 통계와 실제 거래에서 같은 방향이 이어지는지 확인하세요."],
    recommendedTools: has(/아파트|주택|매매|전세/) ? [{ name: "주간 아파트 가격동향 그래프", reason: "자료의 방향을 최신 공식 통계와 비교해보세요." }] : [],
    engine: "local",
  };
}

function formatBytes(bytes: number) {
  if (!bytes) return "직접 입력";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function directionMark(direction: string) {
  return direction === "positive" ? "↑" : direction === "negative" ? "↓" : direction === "uncertain" ? "?" : "–";
}

export default function ResearchWorkspace() {
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("정책 발표");
  const [source, setSource] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [fetchingSource, setFetchingSource] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getRecords().then(setRecords).catch(() => setMessage("이 브라우저의 저장공간을 열 수 없습니다."));
  }, []);

  const cloud = useMemo(() => {
    const aggregate = new Map<string, { weight: number; ids: string[] }>();
    records.forEach((record) => record.analysis.keywords.forEach(({ word, weight }) => {
      const current = aggregate.get(word) ?? { weight: 0, ids: [] };
      current.weight += weight;
      if (!current.ids.includes(record.id)) current.ids.push(record.id);
      aggregate.set(word, current);
    }));
    return [...aggregate].sort((a, b) => b[1].weight - a[1].weight).slice(0, 30);
  }, [records]);

  const visibleRecords = useMemo(() => {
    if (!activeKeyword) return records;
    return records.filter((record) => record.analysis.keywords.some(({ word }) => word === activeKeyword));
  }, [activeKeyword, records]);

  const periodicView = useMemo(() => {
    const now = Date.now();
    const recent = (days: number) => records.filter((record) => now - new Date(record.createdAt).getTime() <= days * 86_400_000);
    const summarize = (items: ResearchRecord[]) => {
      const counts = new Map<string, number>();
      items.forEach((record) => record.analysis.keywords.forEach(({ word }) => counts.set(word, (counts.get(word) ?? 0) + 1)));
      return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([word]) => word);
    };
    const weekly = recent(7);
    const monthly = recent(30);
    return { weeklyCount: weekly.length, monthlyCount: monthly.length, weeklyWords: summarize(weekly), monthlyWords: summarize(monthly) };
  }, [records]);

  function chooseFile(nextFile: File) {
    setFile(nextFile);
    if (!title) setTitle(nextFile.name.replace(/\.[^.]+$/, ""));
    setMessage("");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const nextFile = event.dataTransfer.files[0];
    if (nextFile) chooseFile(nextFile);
  }

  async function analyze() {
    if (FEATURE_DISABLED) {
      setMessage("자료 정리 & 인사이트는 현재 보완중입니다. 기존 자료는 볼 수 있지만 새 AI 분석은 잠시 중단했습니다.");
      return;
    }
    if (!file && pastedText.trim().length < 40) {
      setMessage("파일을 고르거나 분석할 내용을 40자 이상 붙여 넣어주세요.");
      return;
    }
    setBusy(true);
    setMessage("원문을 읽고 핵심을 찾고 있습니다…");
    try {
      const recordTitle = title.trim() || file?.name || "새 자료";
      let analysis: ResearchAnalysis;
      let text = pastedText;
      const extension = file?.name.split(".").pop()?.toLowerCase();
      const canAnalyzeOriginalFile = Boolean(file && (file.type === "application/pdf" || file.type.startsWith("image/") || ["pdf", "png", "jpg", "jpeg", "webp"].includes(extension ?? "")));

      try {
        let response: Response;
        if (file && canAnalyzeOriginalFile) {
          setMessage("AI가 PDF 원본을 직접 읽고 있습니다. 스캔 PDF는 시간이 조금 걸릴 수 있습니다…");
          const form = new FormData();
          form.append("file", file);
          form.append("title", recordTitle);
          form.append("category", category);
          form.append("source", source);
          response = await fetch("/api/research-insights", { method: "POST", body: form });
          text = `${recordTitle}\n\nPDF/이미지 원본을 AI가 직접 분석했습니다.`;
        } else {
          text = file ? await extractText(file) : pastedText;
          if (text.trim().length < MIN_READABLE_TEXT_LENGTH) throw new Error("읽을 수 있는 본문이 너무 짧습니다. 스캔 PDF라면 해상도가 높은 파일이나 본문 직접 붙여넣기를 함께 사용해 주세요.");
          response = await fetch("/api/research-insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: recordTitle, category, source, text: text.slice(0, 45_000) }),
          });
        }
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({} as { error?: string }));
          throw new Error(errorBody.error || "AI 분석 호출에 실패했습니다.");
        }
        analysis = await response.json() as ResearchAnalysis;
      } catch (analysisError) {
        if (canAnalyzeOriginalFile) {
          throw analysisError;
        }
        text = file ? await extractText(file) : pastedText;
        if (text.trim().length < MIN_READABLE_TEXT_LENGTH) throw new Error("읽을 수 있는 본문이 너무 짧습니다. 스캔 PDF라면 해상도가 높은 파일이나 본문 직접 붙여넣기를 함께 사용해 주세요.");
        analysis = localAnalysis(text, recordTitle);
      }
      const record: ResearchRecord = {
        id: crypto.randomUUID(),
        title: recordTitle,
        category,
        source: source.trim(),
        fileName: file?.name ?? "직접 붙여넣기",
        fileType: file?.type ?? "text/plain",
        fileSize: file?.size ?? 0,
        createdAt: new Date().toISOString(),
        original: file,
        analysis,
      };
      await putRecord(record);
      setRecords((current) => [record, ...current]);
      setFile(null);
      setTitle("");
      setSource("");
      setPastedText("");
      setMessage(analysis.engine === "ai" ? "AI 분석과 원본 저장이 끝났습니다." : "기본 분석으로 저장했습니다. AI 연결이 활성화되면 더 정교하게 분석됩니다.");
      window.setTimeout(() => document.getElementById(`doc-${record.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecord(id: string) {
    if (!window.confirm("이 자료와 기기에 저장된 원본을 삭제할까요?")) return;
    await removeRecord(id);
    setRecords((current) => current.filter((record) => record.id !== id));
  }

  function downloadOriginal(record: ResearchRecord) {
    if (!record.original) return;
    const url = URL.createObjectURL(record.original);
    const link = document.createElement("a");
    link.href = url;
    link.download = record.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function fetchSource() {
    if (!source.trim()) { setMessage("출처 URL을 먼저 입력해 주세요."); return; }
    setFetchingSource(true); setMessage("페이지 본문을 가져오는 중입니다…");
    try { const response = await fetch("/api/fetch-source", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: source.trim() }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setPastedText(body.text); setMessage("본문을 가져왔습니다. 내용을 확인한 뒤 분석하세요."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "자동으로 가져오지 못했습니다. 본문을 직접 붙여넣어 주세요."); }
    finally { setFetchingSource(false); }
  }

  async function saveToNotion(record: ResearchRecord) {
    try {
      const content = [
        `요약\n${record.analysis.summary}`,
        `핵심 인사이트\n${record.analysis.insights.join("\n")}`,
        `영향 분석\n${Object.entries(record.analysis.impact).map(([key, value]) => `${key}: ${value.detail}`).join("\n")}`,
        `그래서 나는?\n${record.analysis.actions.join("\n")}`,
      ].join("\n\n");
      const response = await fetch("/api/save-source", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: record.title, content, url: record.source || undefined }) });
      if (!response.ok) throw new Error("저장 실패");
      window.alert("노션 소스뱅크에 저장됐습니다");
    } catch { window.alert("노션 저장에 실패했습니다. NOTION_TOKEN과 소스 뱅크 연결을 확인하세요."); }
  }

  async function saveRawToNotion() {
    if (!title.trim() || !pastedText.trim()) { setMessage("원문 저장에는 제목과 본문이 필요합니다."); return; }
    try {
      const response = await fetch("/api/save-source", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), content: pastedText, url: source.trim() || undefined }) });
      if (!response.ok) throw new Error("저장 실패");
      setMessage("노션 소스뱅크에 원문 그대로 저장됐습니다.");
    } catch { setMessage("원문 저장에 실패했습니다. NOTION_TOKEN 설정을 확인하세요."); }
  }

  return (
    <div className="research-workspace">
      <section className="research-upload-panel">
        <div className="research-section-heading">
          <div><span>01 · INPUT</span><h2>자료 정리 & 인사이트</h2></div>
          <p>보완중 · 새 AI 분석 일시 중단</p>
        </div>
        <div className="research-empty-cloud">
          <b>현재 보완중입니다.</b>
          <span>PDF 요약 품질을 다시 설계하는 동안 새 AI 분석과 저장을 잠시 비활성화했습니다. 기존 저장 기록은 아래에서 확인할 수 있습니다.</span>
        </div>
        <div className="research-form-grid">
          <div className={`research-dropzone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => fileInput.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInput.current?.click(); }}>
            <input ref={fileInput} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf,.docx,.txt,.md,.csv,.json,.html" onChange={(event) => { const nextFile = event.target.files?.[0]; if (nextFile) chooseFile(nextFile); }} />
            <i>{file ? "✓" : "+"}</i>
            <b>{file ? file.name : "파일을 여기에 놓으세요"}</b>
            <span>{file ? formatBytes(file.size) : "또는 눌러서 파일 선택"}</span>
          </div>
          <div className="research-fields">
            <label>자료 제목<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 8·27 부동산 정책 발표" /></label>
            <div><label>종류<select value={category} onChange={(event) => setCategory(event.target.value)}><option>정책 발표</option><option>보고서</option><option>뉴스</option><option>시장 분석</option><option>강의 자료</option><option>기타</option></select></label><label>출처<div className="research-source-row"><input value={source} onChange={(event) => setSource(event.target.value)} placeholder="기관·언론사·URL" /><button type="button" onClick={fetchSource} disabled={fetchingSource}>{fetchingSource ? "가져오는 중…" : "가져오기"}</button></div></label></div>
            <label>본문 직접 붙여넣기<textarea value={pastedText} onChange={(event) => setPastedText(event.target.value)} placeholder="파일이 없다면 기사나 답변 내용을 그대로 붙여 넣으세요." /></label>
          </div>
        </div>
        <div className="research-submit-row">
          <p className="show">{message || "현재 보완중입니다. 새 AI 분석은 잠시 중단했습니다."}</p>
          <div><button type="button" onClick={analyze} disabled>{busy ? "분석 중…" : "보완중"}</button><button type="button" onClick={saveRawToNotion} disabled>원문 저장 중단</button></div>
        </div>
      </section>

      <section className="research-cloud-panel">
        <div className="research-section-heading">
          <div><span>02 · PATTERN</span><h2>누적 워드클라우드</h2></div>
          <p>{records.length}개 자료에서 발견한 반복 신호</p>
        </div>
        {cloud.length ? <div className="research-cloud">
          {cloud.map(([word, info], index) => <button type="button" key={word} className={activeKeyword === word ? "active" : ""} style={{ fontSize: `${13 + Math.min(25, info.weight * 1.4)}px`, color: ["#1b7666", "#e56e42", "#6c55a5", "#2d6072"][index % 4] }} onClick={() => { setActiveKeyword(activeKeyword === word ? null : word); const target = records.find((record) => info.ids.includes(record.id)); if (target) window.setTimeout(() => document.getElementById(`doc-${target.id}`)?.scrollIntoView({ behavior: "smooth" }), 50); }}>{word}<small>{info.ids.length}</small></button>)}
        </div> : <div className="research-empty-cloud"><b>아직 쌓인 키워드가 없어요.</b><span>첫 자료를 넣으면 이곳에 반복되는 신호가 보입니다.</span></div>}
        {activeKeyword && <button type="button" className="research-filter-clear" onClick={() => setActiveKeyword(null)}>‘{activeKeyword}’ 필터 해제 ×</button>}
      </section>

      <section className="research-periodic-panel">
        <div className="research-section-heading"><div><span>03 · RHYTHM</span><h2>정기적 뷰</h2></div><p>반복되는 신호를 주간·월간으로 비교합니다.</p></div>
        <div className="research-periodic-grid"><article><span>LAST 7 DAYS</span><b>{periodicView.weeklyCount}개 자료</b><p>{periodicView.weeklyWords.length ? periodicView.weeklyWords.join(" · ") : "아직 주간 신호가 없습니다."}</p></article><article><span>LAST 30 DAYS</span><b>{periodicView.monthlyCount}개 자료</b><p>{periodicView.monthlyWords.length ? periodicView.monthlyWords.join(" · ") : "아직 월간 신호가 없습니다."}</p></article><article><span>REPEATED SIGNAL</span><b>반복 신호 포착</b><p>{periodicView.monthlyWords[0] ? `‘${periodicView.monthlyWords[0]}’가 가장 자주 등장했습니다. 방향보다 맥락을 함께 확인하세요.` : "자료가 쌓이면 가장 자주 반복된 키워드를 알려드립니다."}</p></article></div>
      </section>

      <section className="research-timeline">
        <div className="research-section-heading">
          <div><span>04 · MEMORY</span><h2>인사이트 타임라인</h2></div>
          <p>요약 → 영향 → 행동이 한 기록에 함께 남습니다.</p>
        </div>
        {!visibleRecords.length && <div className="research-empty-timeline">저장된 자료가 없습니다. 위에서 첫 자료를 넣어보세요.</div>}
        {visibleRecords.map((record) => <article className="research-record" id={`doc-${record.id}`} key={record.id}>
          <div className="research-record-meta">
            <time>{dateTimeFormatter.format(new Date(record.createdAt))}</time>
            <span>{record.category}</span>
            <span>{record.analysis.engine === "ai" ? "AI 분석" : "기본 분석"}</span>
            <button type="button" onClick={() => deleteRecord(record.id)}>삭제</button>
          </div>
          <div className="research-record-title">
            <div><h3>{record.title}</h3><p>{record.source || "출처 미입력"} · {record.fileName} · {formatBytes(record.fileSize)}</p></div>
            <div className="research-record-actions"><button type="button" onClick={() => saveToNotion(record)}>노션에 저장</button>{record.original && <button type="button" onClick={() => downloadOriginal(record)}>원본 받기 ↓</button>}</div>
          </div>
          <section className="research-summary"><span>한눈에 요약</span><p>{record.analysis.summary}</p><ul>{record.analysis.insights.map((insight) => <li key={insight}>{insight}</li>)}</ul></section>
          <div className="research-keywords">{record.analysis.keywords.map(({ word }) => <button type="button" key={word} onClick={() => setActiveKeyword(word)}>#{word}</button>)}</div>
          <div className="research-impact-wrap">
            <h4>🔴 나에게 미치는 영향</h4>
            <div className="research-impact-grid">{(Object.keys(impactLabels) as Array<keyof typeof impactLabels>).map((key) => { const item = record.analysis.impact[key]; return <div className={item.direction} key={key}><i>{directionMark(item.direction)}</i><b>{impactLabels[key]}</b><p>{item.detail}</p></div>; })}</div>
          </div>
          <div className="research-perspectives">
            <h4>⚖️ 다각도 해석</h4>
            <div><article className="positive"><span>긍정적 시각</span><p>{record.analysis.perspectives?.positive ?? "기회가 될 수 있는 조건과 수혜 대상을 확인하세요."}</p></article><article className="negative"><span>부정적 시각</span><p>{record.analysis.perspectives?.negative ?? "비용과 손실 가능성, 예상이 틀릴 때의 대응을 점검하세요."}</p></article><article className="neutral"><span>중립적 시각</span><p>{record.analysis.perspectives?.neutral ?? "한 자료만으로 결론내리지 말고 다음 공식 수치를 확인하세요."}</p></article></div>
          </div>
          <div className="research-action-wrap">
            <div><span>SO, WHAT NOW?</span><h4>💡 그래서 나는?</h4></div>
            <ol>{record.analysis.actions.map((action) => <li key={action}>{action}</li>)}</ol>
            {!!record.analysis.recommendedTools.length && <div className="research-tool-links">{record.analysis.recommendedTools.map((tool) => <a href={toolLinks[tool.name] ?? "/"} key={tool.name}><b>{tool.name} →</b><span>{tool.reason}</span></a>)}</div>}
          </div>
        </article>)}
      </section>
    </div>
  );
}
