// app/api/knowledge-universe/route.js
// GET /api/knowledge-universe
// 투자 판단 OS Notion 워크스페이스(규칙 라이브러리/인물 알고리즘/원칙 지도)를
// 서버에서 조회해 프런트가 바로 쓸 수 있는 JSON으로 합쳐 반환.
//
// 사전 준비 (README.md 참고):
//   1) Notion 통합(Integration) 생성 → Secret 토큰 발급
//   2) 아래 6개 DB에 그 통합 연결 (Notion 페이지 "..." → 연결 추가)
//   3) Vercel 프로젝트에 NOTION_TOKEN 환경변수로 그 토큰 등록

import { fetchAndFlatten } from "../../../lib/notion";

// 실제 워크스페이스에서 확인된 데이터베이스 ID (2026-08-28 기준, 투자 판단 OS 하위)
const DB = {
  소스뱅크: "87b75ba5-2aee-4501-a31f-697eba133470",
  규칙라이브러리: "5f14072d-92a2-4504-9ba8-9b279754bab0",
  인물알고리즘: "3d9cfd64-aea8-4b16-b33c-d338327f7e0b",
  원칙지도: "19aa2aa7-d6e2-45ca-8451-564242ba87fd",
  마켓스냅샷: "79f3e115-413c-4c40-b641-ed52686f2253",
  투자판단일지: "83e8d3a9-b68b-4c60-91e4-f0de5834a2cf",
};

export async function GET() {
  try {
    const [규칙, 인물, 원칙] = await Promise.all([
      fetchAndFlatten(DB.규칙라이브러리),
      fetchAndFlatten(DB.인물알고리즘),
      fetchAndFlatten(DB.원칙지도),
    ]);

    return Response.json({
      updatedAt: new Date().toISOString(),
      규칙라이브러리: 규칙, // Rule ID/제목, 인물, 상황, 판단, 행동, 레이어, 근거수준, 검증상태 ...
      인물알고리즘: 인물, // 인물, 버전, 상태라벨, 근거Rule ...
      원칙지도: 원칙, // 원칙/쟁점 ID, 설명, 유형, 근거 규칙 ...
    });
  } catch (err) {
    console.error("[knowledge-universe] Notion 조회 실패:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
