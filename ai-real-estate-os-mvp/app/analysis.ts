export type ListingKind = "asking" | "transaction";
export type SourceKind = "official" | "user" | "ad" | "calculation" | "estimate" | "expert" | "check" | "sample";

export type Comparable = {
  id: string;
  name: string;
  kind: ListingKind;
  price: number;
  floor: string;
  occupancy: string;
  sourceKind: SourceKind;
  source: string;
  checkedAt: string;
  included: boolean;
};

export type RedevelopmentCandidate = {
  id: string;
  name: string;
  region: string;
  projectType: string;
  stage: string;
  salePrice: number;
  officialPrice: number | null;
  deposit: number | null;
  assumableLoan: number | null;
  immediateCosts: number | null;
  contributionLow: number | null;
  contributionHigh: number | null;
  yearsLow: number;
  yearsHigh: number;
  rightsStatus: "확인" | "일부 확인" | "미확인";
  source: string;
  sourceKind: SourceKind;
  checkedAt: string;
};

export type PriceBand = { low: number; median: number; high: number; count: number; method: string } | null;

const round = (value: number) => Math.round(value * 100) / 100;

export function priceBand(values: number[]): PriceBand {
  const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (sorted.length < 2) return null;
  const medianAt = (arr: number[]) => {
    const middle = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[middle] : (arr[middle - 1] + arr[middle]) / 2;
  };
  if (sorted.length < 5) {
    return { low: sorted[0], median: round(medianAt(sorted)), high: sorted.at(-1)!, count: sorted.length, method: "최저·중앙·최고 (표본 부족)" };
  }
  const quantile = (q: number) => {
    const position = (sorted.length - 1) * q;
    const base = Math.floor(position);
    const rest = position - base;
    return sorted[base + 1] === undefined ? sorted[base] : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  };
  return { low: round(quantile(.25)), median: round(quantile(.5)), high: round(quantile(.75)), count: sorted.length, method: "25%·중앙·75%" };
}

export function duplicateIds(items: Comparable[]) {
  const seen = new Map<string, string>();
  const duplicates = new Set<string>();
  items.filter((item) => item.kind === "asking").forEach((item) => {
    const normalized = `${item.name.replace(/\s/g, "").toLowerCase()}|${round(item.price)}|${item.floor}|${item.occupancy}`;
    const first = seen.get(normalized);
    if (first) { duplicates.add(first); duplicates.add(item.id); } else seen.set(normalized, item.id);
  });
  return duplicates;
}

export function analyzePrice(items: Comparable[], mode: "buy" | "sell") {
  const included = items.filter((item) => item.included);
  const asking = priceBand(included.filter((item) => item.kind === "asking").map((item) => item.price));
  const transaction = priceBand(included.filter((item) => item.kind === "transaction").map((item) => item.price));
  const anchor = transaction?.median ?? asking?.median ?? null;
  const askingMedian = asking?.median ?? anchor;
  if (!anchor || !askingMedian) return { asking, transaction, review: null, signal: "비교자료가 부족해 가격 검토값을 만들지 않았습니다." };
  const review = mode === "buy"
    ? { first: round(Math.min(asking?.low ?? askingMedian, anchor * .97)), target: round(Math.min(askingMedian, anchor)), limit: round(Math.max(anchor, transaction?.high ?? anchor)) }
    : { first: round(transaction?.median ?? anchor), target: round(askingMedian), limit: round(asking?.high ?? askingMedian) };
  const gap = transaction && asking ? (asking.median / transaction.median - 1) * 100 : null;
  const signal = gap === null ? "호가 또는 실거래 한쪽만 있어 방향성 해석을 보류합니다."
    : gap > 5 ? `호가 중앙값이 실거래 중앙값보다 ${round(gap)}% 높게 관찰됩니다.`
      : gap < -5 ? `호가 중앙값이 실거래 중앙값보다 ${Math.abs(round(gap))}% 낮게 관찰됩니다.`
        : "호가와 실거래 중앙값 차이가 5% 이내입니다.";
  return { asking, transaction, review, signal };
}

export function initialCash(candidate: RedevelopmentCandidate) {
  const missing: string[] = [];
  if (candidate.deposit === null) missing.push("승계 임대보증금");
  if (candidate.assumableLoan === null) missing.push("승계 가능 대출");
  if (candidate.immediateCosts === null) missing.push("즉시 부대비용");
  const value = candidate.salePrice - (candidate.deposit ?? 0) - (candidate.assumableLoan ?? 0) + (candidate.immediateCosts ?? 0);
  return { value: round(value), missing };
}

export function totalInvestmentRange(candidate: RedevelopmentCandidate) {
  if (candidate.contributionLow === null || candidate.contributionHigh === null) return null;
  return { low: round(candidate.salePrice + candidate.contributionLow + (candidate.immediateCosts ?? 0)), high: round(candidate.salePrice + candidate.contributionHigh + (candidate.immediateCosts ?? 0)) };
}

export function moneyFromText(text: string) {
  const normalized = text.replace(/,/g, "");
  const eok = normalized.match(/(\d+(?:\.\d+)?)\s*억/);
  const man = normalized.match(/(\d+(?:\.\d+)?)\s*만/);
  if (!eok && !man) return null;
  return round((eok ? Number(eok[1]) : 0) + (man ? Number(man[1]) / 10000 : 0));
}

export function extractListingFields(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const findMoney = (keywords: string[]) => {
    const line = lines.find((candidate) => keywords.some((keyword) => candidate.includes(keyword)));
    return line ? moneyFromText(line) : null;
  };
  const stageNames = ["추진준비", "정비구역지정", "구역지정", "추진위승인", "조합설립인가", "사업시행인가", "관리처분인가", "착공", "준공"];
  const stage = stageNames.find((name) => text.includes(name)) ?? null;
  const shareLine = lines.find((line) => /대지지분|토지지분/.test(line));
  const share = shareLine?.match(/(\d+(?:\.\d+)?)\s*(?:㎡|m2|평)/i)?.[0] ?? null;
  return {
    salePrice: findMoney(["매매가", "매매", "가격"]),
    deposit: findMoney(["보증금", "전세", "임대보증"]),
    initial: findMoney(["초투", "초기투자금"]),
    officialPrice: findMoney(["공시가", "공시가격"]),
    contribution: findMoney(["분담금", "추가분담"]),
    stage,
    landShare: share,
  };
}

export function formatEok(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "확인 필요";
  if (value === 0) return "0원";
  const eok = Math.floor(value);
  const man = Math.round((value - eok) * 10000);
  if (eok && man) return `${eok}억 ${man.toLocaleString("ko-KR")}만원`;
  if (eok) return `${eok}억원`;
  return `${man.toLocaleString("ko-KR")}만원`;
}
