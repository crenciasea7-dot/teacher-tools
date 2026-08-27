type Week = { date: string; saleRate: number; jeonseRate: number; saleIndex?: number; jeonseIndex?: number };
type District = { name: string; weeks: Week[] };
type Region = { name: string; weeks: Week[]; districts?: District[] };
type RebResponse = { latestDate: string; releaseDate: string; regions: Region[] };

const SOURCE_URL = "https://rone-weekly-capital-dashboard.vercel.app/api/reb";
const SOURCE_PAGE = "https://rone-weekly-capital-dashboard.vercel.app/";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function current(region: Region | undefined) { return region?.weeks.at(-1); }
function previous(region: Region | undefined) { return region?.weeks.at(-2); }
function round(value: number) { return Number(value.toFixed(2)); }
function average(values: number[]) { return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; }

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AI-Invest-Tools/1.0)" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`R-ONE data request failed: ${response.status}`);
    const data = (await response.json()) as RebResponse;
    const byName = new Map(data.regions.map((region) => [region.name, region]));
    const capital = ["서울", "경기", "인천"].map((name) => byName.get(name)).filter(Boolean) as Region[];
    const local = ["부산", "대구", "광주", "대전", "울산"].map((name) => byName.get(name)).filter(Boolean) as Region[];
    const all = [...capital, ...local];
    const aggregate = (regions: Region[], key: "saleRate" | "jeonseRate", before = false) => average(regions.map((region) => (before ? previous(region) : current(region))?.[key]).filter((value): value is number => Number.isFinite(value)));
    const seoul = byName.get("서울");
    const seoulNow = current(seoul);
    const seoulBefore = previous(seoul);

    const summary = [
      { area: "전국*", saleRate: aggregate(all, "saleRate"), previousSaleRate: aggregate(all, "saleRate", true), jeonseRate: aggregate(all, "jeonseRate") },
      { area: "수도권*", saleRate: aggregate(capital, "saleRate"), previousSaleRate: aggregate(capital, "saleRate", true), jeonseRate: aggregate(capital, "jeonseRate") },
      { area: "서울", saleRate: seoulNow?.saleRate ?? 0, previousSaleRate: seoulBefore?.saleRate ?? 0, jeonseRate: seoulNow?.jeonseRate ?? 0 },
      { area: "지방*", saleRate: aggregate(local, "saleRate"), previousSaleRate: aggregate(local, "saleRate", true), jeonseRate: aggregate(local, "jeonseRate") },
    ];

    const districtMap = new Map((seoul?.districts ?? []).map((district) => [district.name, district]));
    const districtResult = (names: string[]) => names.map((name) => {
      const district = districtMap.get(name);
      const latest = district?.weeks.at(-1);
      const prior = district?.weeks.at(-2);
      return { name, saleRate: latest?.saleRate ?? 0, previousSaleRate: prior?.saleRate ?? 0, jeonseRate: latest?.jeonseRate ?? 0, falling: (latest?.saleRate ?? 0) < 0 };
    });
    const gangnam = districtResult(["강남구", "서초구"]);
    const nonGangnam = districtResult(["성북구", "중랑구", "서대문구", "중구", "강북구"]);

    const saleDelta = round((seoulNow?.saleRate ?? 0) - (seoulBefore?.saleRate ?? 0));
    const jeonseSupports = (seoulNow?.jeonseRate ?? 0) > 0 && (seoulNow?.jeonseRate ?? 0) >= (seoulNow?.saleRate ?? 0) * 0.65;
    const fallingGangnam = gangnam.filter((district) => district.falling).length;
    const risingNonGangnam = nonGangnam.filter((district) => district.saleRate > 0).length;
    const mixed = [...gangnam, ...nonGangnam].some((district) => district.saleRate < 0) && [...gangnam, ...nonGangnam].some((district) => district.saleRate > 0);

    let phase = "쉬어가는 장세";
    if ((seoulNow?.saleRate ?? 0) < 0 && fallingGangnam > 0) phase = "하락장 진입";
    else if ((seoulNow?.saleRate ?? 0) >= 0 && saleDelta >= 0.03 && risingNonGangnam >= 3) phase = "턴어라운드 전조";
    else if ((seoulNow?.saleRate ?? 0) > 0 && saleDelta <= -0.03) phase = "상승세 둔화";
    else if (mixed || Math.abs(seoulNow?.saleRate ?? 0) < 0.05) phase = "혼조·관망";

    const trendText = saleDelta > 0.005 ? `서울 매매 상승폭이 전주보다 ${saleDelta.toFixed(2)}%p 확대됐습니다.` : saleDelta < -0.005 ? `서울 매매 상승폭이 전주보다 ${Math.abs(saleDelta).toFixed(2)}%p 축소됐습니다.` : "서울 매매 상승폭은 전주와 비슷합니다.";
    const qualitative = mixed
      ? "강남권과 비강남권의 방향이 엇갈려 관망 성격이 강합니다."
      : risingNonGangnam >= 4 ? `비강남 관찰지역 ${risingNonGangnam}곳이 상승해 확산 지지력이 확인됩니다.`
      : "상승 지역의 확산이 제한적이어서 개별 단지 확인이 필요합니다.";

    return Response.json({
      latestDate: data.latestDate,
      releaseDate: data.releaseDate,
      updatedAt: new Date().toISOString(),
      summary,
      seoul: { gangnam, nonGangnam },
      analysis: {
        trend: trendText,
        jeonse: jeonseSupports ? "서울 전세가가 플러스를 유지해 매매 흐름을 일부 받치고 있습니다." : "전세 지지력이 약해 매매 상승의 지속성을 보수적으로 봐야 합니다.",
        qualitative,
        transactionNote: "공식 주간지수에는 개별 하락 거래·역세권·대단지 계약 정보가 없어 실거래 원문 추가 확인이 필요합니다.",
        phase,
        conclusion: `현재 자료 기준으로는 ${phase}입니다.`,
      },
      methodology: "서울은 공식 R-ONE 값, 전국·수도권·지방(*)은 현재 화면에 수록된 8개 지역 단순평균입니다.",
      sourceUrl: SOURCE_PAGE,
    }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "자료를 불러오지 못했습니다." }, { status: 502 });
  }
}
