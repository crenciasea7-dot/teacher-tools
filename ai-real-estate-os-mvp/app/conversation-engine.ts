export type Intent = "buy" | "sell" | "redevelopment-budget" | "redevelopment-listing" | "automation" | "unknown";
export type EvidenceKind = "user" | "ocr" | "official" | "ad" | "calculation" | "estimate" | "check" | "sample";
export type UserMode = "demo" | "student" | "actual" | "browse";

export type Extracted<T> = {
  value: T;
  kind: EvidenceKind;
  confidence: number;
  raw: string;
  updated?: boolean;
};

export type PropertyRecord = {
  complexName?: Extracted<string>;
  unitType?: Extracted<string>;
  price?: Extracted<number>;
  floor?: Extracted<number>;
  floorType?: Extracted<string>;
  direction?: Extracted<string>;
  occupancy?: Extracted<string>;
  availableDate?: Extracted<string>;
};

export type ComparableRecord = PropertyRecord & {
  id: string;
  label: string;
  broker?: string;
  duplicateCandidate?: boolean;
};

export type InvestmentCase = {
  intent: Intent;
  intentConfidence: number;
  subject: PropertyRecord;
  comparables: ComparableRecord[];
  duplicateBroker?: string;
  budget?: Extracted<number>;
  region?: Extracted<string>;
  projectStage?: Extracted<string>;
  strategy?: "normal" | "fast-sale";
  missingQuestions: string[];
  sourceText: string;
};

export type Scenario = { title: string; value: string; meaning: string; kind: EvidenceKind };
export type CaseAnalysis = {
  headline: string;
  conclusion: string;
  metrics: Array<{ label: string; value: string; note: string }>;
  reasons: string[];
  scenarios: Scenario[];
  nextActions: string[];
  warning: string;
};

export const intentLabels: Record<Intent, string> = {
  buy: "아파트 매수",
  sell: "아파트 매도",
  "redevelopment-budget": "재개발 초기투자금 찾기",
  "redevelopment-listing": "재개발 매물 분석",
  automation: "반복업무 자동화",
  unknown: "목적 확인 필요",
};

const aliasMap: Record<string, string> = {
  "위례24단지": "송파꿈에그린위례24단지",
  "위례 24단지": "송파꿈에그린위례24단지",
};

const extracted = <T,>(value: T, kind: EvidenceKind, confidence: number, raw: string, updated = false): Extracted<T> => ({ value, kind, confidence, raw, updated });
const firstMatch = (text: string, regex: RegExp) => text.match(regex)?.[1];
const clampConfidence = (value: number) => Math.max(0, Math.min(1, value));

export function classifyIntent(text: string): { intent: Intent; confidence: number } {
  const normalized = text.replace(/\s+/g, " ");
  const scores: Record<Intent, number> = { buy: 0, sell: 0, "redevelopment-budget": 0, "redevelopment-listing": 0, automation: 0, unknown: 0 };
  if (/내놨|내놓|매도|팔(고|려|까)|우리\s*집.*가격/.test(normalized)) scores.sell += 5;
  if (/사려|매수|살까|구매|관심\s*매물/.test(normalized)) scores.buy += 4;
  if (/초투|초기\s*투자금|내\s*돈으로.*재개발/.test(normalized)) scores["redevelopment-budget"] += 5;
  if (/재개발|재건축/.test(normalized) && /매물|캡처|권리|분담금|대지지분/.test(normalized)) scores["redevelopment-listing"] += 4;
  if (/자동화|정기\s*보고|통화\s*정리|매물\s*변화|임장\s*보고/.test(normalized)) scores.automation += 5;
  const [intent, score] = (Object.entries(scores) as Array<[Intent, number]>).sort((a, b) => b[1] - a[1])[0];
  return score === 0 ? { intent: "unknown", confidence: .2 } : { intent, confidence: clampConfidence(.55 + score * .08) };
}

export function parseKoreanMoney(raw: string): number | null {
  const compact = raw.replace(/,/g, "");
  const eok = compact.match(/(\d+(?:\.\d+)?)\s*억/);
  const man = compact.match(/(\d+(?:\.\d+)?)\s*만/);
  if (!eok && !man) return null;
  return Math.round(((eok ? Number(eok[1]) : 0) + (man ? Number(man[1]) / 10000 : 0)) * 10000) / 10000;
}

function parseComplex(text: string) {
  const alias = Object.keys(aliasMap).find((key) => text.includes(key));
  if (alias) return extracted(aliasMap[alias], "estimate", .93, alias);
  const raw = firstMatch(text, /(?:우리\s*)?([가-힣A-Za-z0-9]+(?:아파트|단지))/);
  return raw ? extracted(raw, "user", .82, raw) : undefined;
}

function parseSubject(text: string): PropertyRecord {
  const subject: PropertyRecord = {};
  subject.complexName = parseComplex(text);
  const unit = firstMatch(text, /(\d+(?:\.\d+)?\s*[A-Za-z])(?:\s|집|형|타입)/i);
  if (unit) subject.unitType = extracted(unit.replace(/\s/g, "").toUpperCase(), "user", .96, unit);
  const subjectPriceRaw = text.match(/(\d+(?:\.\d+)?\s*억(?:\s*\d+(?:,\d{3})*\s*만)?)(?:에)?\s*(?:내놨|내놓|올렸|매도|받고)/)?.[1]
    ?? text.match(/우리[^.\n]{0,60}?(\d+(?:\.\d+)?\s*억(?:\s*\d+(?:,\d{3})*\s*만)?)/)?.[1];
  const subjectPrice = subjectPriceRaw ? parseKoreanMoney(subjectPriceRaw) : null;
  if (subjectPrice !== null && subjectPriceRaw) subject.price = extracted(subjectPrice, "user", .98, subjectPriceRaw);
  const floorRaw = firstMatch(text, /(\d+)\s*층/);
  if (floorRaw) subject.floor = extracted(Number(floorRaw), "user", .94, `${floorRaw}층`);
  if (/아래(?:가|는)?\s*필로티|필로티\s*(?:위|상부)|필로티고/.test(text)) subject.floorType = extracted("필로티 상부층", "user", .96, "아래가 필로티");
  const direction = firstMatch(text, /(남동향|남서향|북동향|북서향|동향|서향|남향|북향)/);
  if (direction) subject.direction = extracted(direction, "user", .96, direction);
  if (/바로\s*입주|즉시\s*입주/.test(text)) subject.occupancy = extracted("즉시입주", "user", .95, text.match(/바로\s*입주|즉시\s*입주/)?.[0] ?? "즉시입주");
  return subject;
}

function parseComparables(text: string, subjectPrice?: number): ComparableRecord[] {
  // Keep decimal prices such as 15.5억 intact while splitting sentences/list items.
  const segments = text.split(/\.(?=\s|$)|\n|,(?=\s*\d)/).map((segment) => segment.trim()).filter(Boolean);
  const records: ComparableRecord[] = [];
  for (const segment of segments) {
    const priceRaw = segment.match(/(\d+(?:\.\d+)?\s*억(?:\s*\d+(?:,\d{3})*\s*만)?)/)?.[1];
    const price = priceRaw ? parseKoreanMoney(priceRaw) : null;
    if (price === null || (subjectPrice !== undefined && Math.abs(price - subjectPrice) < .0001 && /우리|내놨|내놓/.test(segment))) continue;
    const record: ComparableRecord = { id: `comp-${records.length + 1}`, label: `경쟁 ${String.fromCharCode(65 + records.length)}` };
    record.price = extracted(price, "ad", .9, priceRaw!);
    const floorRaw = firstMatch(segment, /(\d+)\s*층/);
    if (floorRaw) record.floor = extracted(Number(floorRaw), "ad", .88, `${floorRaw}층`);
    if (/필로티/.test(segment)) record.floorType = extracted("필로티 상부층", "ad", .84, "필로티");
    const direction = firstMatch(segment, /(남동향|남서향|북동향|북서향|동향|서향|남향|북향)/);
    if (direction) record.direction = extracted(direction, "ad", .82, direction);
    if (/즉시\s*입주|바로\s*입주/.test(segment)) record.occupancy = extracted("즉시입주", "ad", .9, segment.match(/즉시\s*입주|바로\s*입주/)?.[0] ?? "즉시입주");
    if (/세입자|세\s*안고|임차인/.test(segment)) record.occupancy = extracted("임차인 거주", "ad", .9, segment.match(/세입자|세\s*안고|임차인/)?.[0] ?? "임차인 거주");
    const available = segment.match(/(?:내년|다음\s*해)\s*(\d{1,2})월/);
    if (available) record.availableDate = extracted(`다음 해 ${available[1]}월`, "ad", .9, available[0]);
    records.push(record);
  }
  return records;
}

function importantQuestions(data: Omit<InvestmentCase, "missingQuestions">): string[] {
  const questions: string[] = [];
  if (data.intent === "sell") {
    questions.push("최근 6개월 같은 평형 실거래가와 거래일을 알고 있나요?");
    if (!/문의|방문|협상|전화/.test(data.sourceText)) questions.push("광고 후 문의·방문·가격 제안이 몇 건 있었나요?");
    if (!data.subject.occupancy) questions.push("실제 입주 가능한 가장 빠른 날짜가 언제인가요?");
  } else if (data.intent === "buy") {
    if (!data.budget) questions.push("취득비용을 포함해 감당할 수 있는 총예산은 얼마인가요?");
    if (!data.subject.occupancy) questions.push("반드시 입주해야 하는 시점이 있나요?");
    questions.push("최근 실거래와 현재 경쟁호가 자료가 있나요?");
  } else if (data.intent === "redevelopment-budget") {
    if (!data.budget) questions.push("지금 사용할 수 있는 초기투자금은 얼마인가요?");
    if (!data.region) questions.push("우선 보고 싶은 지역은 어디인가요?");
    questions.push("감당 가능한 투자기간과 향후 추가자금은 어느 정도인가요?");
  } else if (data.intent === "redevelopment-listing") {
    questions.push("권리산정기준일과 조합원 분양자격을 공식자료로 확인했나요?");
    questions.push("승계보증금·승계대출·예상분담금 중 확인된 값은 무엇인가요?");
  } else if (data.intent === "automation") {
    questions.push("반복되는 입력자료는 통화·캡처·PDF 중 무엇인가요?");
    questions.push("수동 실행과 정기 실행 중 어느 방식이 필요한가요?");
  } else questions.push("매수·매도·재개발 초투·재개발 매물분석·자동화 중 무엇을 하고 싶으신가요?");
  return questions.slice(0, 3);
}

export function parseInvestmentRequest(text: string): InvestmentCase {
  const { intent, confidence } = classifyIntent(text);
  const subject = parseSubject(text);
  const comparables = parseComparables(text, subject.price?.value);
  const duplicateMatch = text.match(/([가-힣A-Za-z0-9]+)\s*(?:공인(?:중개사)?|부동산)[^.\n]{0,40}중복\s*광고/);
  const duplicateBroker = duplicateMatch?.[1];
  if (duplicateBroker) comparables.forEach((record) => { record.broker = duplicateBroker; record.duplicateCandidate = true; });
  const budgetRaw = text.match(/(?:초투|초기\s*투자금|가용\s*자금)[^\d]{0,10}(\d+(?:\.\d+)?\s*억(?:\s*\d+(?:,\d{3})*\s*만)?)/)?.[1];
  const budgetValue = budgetRaw ? parseKoreanMoney(budgetRaw) : null;
  const data: Omit<InvestmentCase, "missingQuestions"> = {
    intent,
    intentConfidence: confidence,
    subject,
    comparables,
    duplicateBroker,
    budget: budgetValue !== null && budgetRaw ? extracted(budgetValue, "user", .92, budgetRaw) : undefined,
    strategy: "normal",
    sourceText: text,
  };
  return { ...data, missingQuestions: importantQuestions(data) };
}

export function applyFollowUp(previous: InvestmentCase, text: string): InvestmentCase {
  const next: InvestmentCase = {
    ...previous,
    subject: { ...previous.subject },
    comparables: previous.comparables.map((record) => ({ ...record })),
    sourceText: `${previous.sourceText}\n후속: ${text}`,
  };
  const priceRaw = text.match(/(\d+(?:\.\d+)?\s*억(?:\s*\d+(?:,\d{3})*\s*만)?)/)?.[1];
  const price = priceRaw ? parseKoreanMoney(priceRaw) : null;
  if (price !== null && priceRaw && /그럼|으로|이면|가격|호가|낮추|올리/.test(text)) next.subject.price = extracted(price, "user", .99, priceRaw, true);
  if (/빨리\s*팔|빠른\s*매도|급매/.test(text)) next.strategy = "fast-sale";
  const supplemental = parseInvestmentRequest(text);
  if (!next.subject.direction && supplemental.subject.direction) next.subject.direction = supplemental.subject.direction;
  if (!next.subject.occupancy && supplemental.subject.occupancy) next.subject.occupancy = supplemental.subject.occupancy;
  const base: Omit<InvestmentCase, "missingQuestions"> = { ...next };
  next.missingQuestions = importantQuestions(base);
  return next;
}

const money = (value?: number) => value === undefined ? "확인 필요" : `${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}억원`;

export function analyzeInvestmentCase(data: InvestmentCase): CaseAnalysis {
  if (data.intent === "sell") {
    const subjectPrice = data.subject.price?.value;
    const comps = data.comparables.filter((record) => record.price);
    const prices = comps.map((record) => record.price!.value).sort((a, b) => a - b);
    const allPrices = subjectPrice === undefined ? prices : [...prices, subjectPrice].sort((a, b) => a - b);
    const rank = subjectPrice === undefined ? null : allPrices.findIndex((value) => value === subjectPrice) + 1;
    const immediate = comps.filter((record) => record.occupancy?.value === "즉시입주").map((record) => record.price!.value).sort((a, b) => a - b);
    const nextLowest = prices[0];
    const adjusted = subjectPrice === undefined ? undefined : Math.round((subjectPrice - .2) * 10) / 10;
    const fast = immediate[0] ?? prices[0];
    return {
      headline: subjectPrice ? `현재 ${money(subjectPrice)} 호가는 ${allPrices.length}개 중 ${rank}번째로 낮습니다.` : "우리 집 호가를 확인해야 순위를 계산할 수 있습니다.",
      conclusion: "현재 입력만으로는 호가 경쟁력까지 분석할 수 있습니다. 적정 매도가 확정에는 최근 실거래와 문의 반응이 추가로 필요합니다.",
      metrics: [
        { label: "전체 최저호가", value: money(prices[0]), note: comps.find((record) => record.price?.value === prices[0])?.floor?.value === 1 ? "1층 광고 — 직접 비교 시 층 차이 반영 필요" : "광고 기준" },
        { label: "즉시입주 경쟁 최저", value: money(immediate[0]), note: immediate.length ? "입주조건 기준으로만 필터" : "확인된 경쟁매물 없음" },
        { label: "우리 집 매도 후 다음 호가", value: money(nextLowest), note: "중복광고를 별도 매물로 확정하지 않은 값" },
        { label: "중복광고 후보", value: data.duplicateBroker ? `${data.duplicateBroker} 공인` : "없음/미확인", note: "자동 삭제하지 않고 중개사 확인 필요" },
      ],
      reasons: [
        data.subject.floorType?.value === "필로티 상부층" ? "3층이지만 아래가 필로티인 조건을 일반 3층과 별도로 보았습니다." : "층·필로티 조건 확인이 필요합니다.",
        data.subject.occupancy?.value === "즉시입주" ? "즉시입주 가능성은 세입자 거주 매물과 분리해 비교했습니다." : "입주 가능일이 확인되지 않았습니다.",
        data.subject.direction ? `${data.subject.direction.value}은 사용자 제공 사실로 표시하고 가격 프리미엄을 임의 계산하지 않았습니다.` : "향 정보가 없어 방향 차이를 계산하지 않았습니다.",
      ],
      scenarios: [
        { title: "호가 유지", value: money(subjectPrice), meaning: "문의·방문이 이어지는지 다음 관찰일까지 확인", kind: "user" },
        { title: "소폭 조정 검토", value: money(adjusted), meaning: "15.5억 경쟁매물과의 간격을 줄이는 가정이며 추천값이 아님", kind: "estimate" },
        { title: "빠른 매도 검토", value: money(fast), meaning: "즉시입주 경쟁 최저와 맞추는 가정. 층 차이와 실거래 검증 필요", kind: "estimate" },
      ],
      nextActions: ["최근 6개월 같은 평형 실거래 3건 이상 추가", "중개사에게 동일 매물 광고 ID·동·층 확인", "문의·방문·가격 제안 수를 주간 기록", "7일 뒤 호가 유지 조건 재검토"],
      warning: "광고 호가만으로 상승·하락이나 실제 체결가를 단정하지 않습니다.",
    };
  }
  if (data.intent === "buy") return { headline: "매수 조건을 구조화했습니다.", conclusion: "관심 매물·실거래·경쟁호가를 첨부하면 기존 가격 밴드 로직으로 분석합니다.", metrics: [], reasons: ["구매력과 실입주 조건을 먼저 분리합니다."], scenarios: [], nextActions: ["관심 매물 캡처 추가", "최근 실거래 추가", "중개사 질문 만들기"], warning: "후보 데이터가 없으면 추천 완료로 표시하지 않습니다." };
  if (data.intent === "redevelopment-budget") return { headline: "초기투자금 조건을 이해했습니다.", conclusion: "중개사에게 받은 설명이나 직접 보유한 캡처를 추가하면 확인된 값 안에서 필요한 현금을 비교합니다.", metrics: [{ label: "가용 초투", value: money(data.budget?.value), note: "사용자 제공" }], reasons: ["승계 가능한 것으로 확인된 대출만 차감합니다."], scenarios: [], nextActions: ["받은 매물 설명 또는 캡처 추가", "사업단계·권리상태 확인"], warning: "잠긴 외부 데이터는 가져오지 않으며, 확인되지 않은 값은 비워둡니다." };
  if (data.intent === "redevelopment-listing") return { headline: "재개발 매물 검증으로 이해했습니다.", conclusion: "캡처 OCR 결과를 확인한 뒤 초투와 권리 질문을 분리합니다.", metrics: [], reasons: ["광고문구는 공식 확인과 분리합니다."], scenarios: [], nextActions: ["캡처 1~5장 추가", "개인정보 가리기", "조합·구청 질문 확인"], warning: "캡처만으로 조합원 자격을 확정하지 않습니다." };
  if (data.intent === "automation") return { headline: "반복 투자업무 자동화로 이해했습니다.", conclusion: "입력자료·실행주기·원하는 결과를 확인해 자동화 수준을 구분합니다.", metrics: [], reasons: [], scenarios: [], nextActions: ["자동화 메뉴판에서 사례 선택"], warning: "외부 발송과 정기 실행은 별도 승인과 연결이 필요합니다." };
  return { headline: "아직 목적을 확정하지 않았습니다.", conclusion: "평소 말하듯 하고 싶은 일을 한 문장으로 적어주세요.", metrics: [], reasons: [], scenarios: [], nextActions: ["목적 카드 선택"], warning: "받지 않은 정보를 임의로 채우지 않습니다." };
}

export const WIRYE_SELL_SCENARIO = "우리 위례24단지 70A 집을 16억에 내놨어. 3층인데 아래가 필로티고 동향이며 즉시입주 가능해. 15억 매물은 1층이고 즉시입주 가능, 15.5억 매물은 세입자가 있고 다음 해 3월 입주 가능이야. 탑위례 공인이 올린 다른 광고는 우리 물건의 중복광고일 수 있어. 우리 매도가가 적정한지 봐줘.";
