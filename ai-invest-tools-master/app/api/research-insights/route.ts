import { createGateway, generateText, Output } from "ai";
import { getVercelOidcToken } from "@vercel/oidc";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const impactItem = z.object({
  direction: z.enum(["positive", "neutral", "negative", "uncertain"]),
  detail: z.string(),
});

const analysisSchema = z.object({
  summary: z.string(),
  insights: z.array(z.string()).min(2).max(6),
  keywords: z.array(z.object({ word: z.string(), weight: z.number().int().min(1).max(10) })).min(5).max(14),
  impact: z.object({
    salePrice: impactItem,
    loan: impactItem,
    tax: impactItem,
    policy: impactItem,
    sentiment: impactItem,
  }),
  perspectives: z.object({
    positive: z.string(),
    negative: z.string(),
    neutral: z.string(),
  }),
  actions: z.array(z.string()).min(2).max(5),
  recommendedTools: z.array(z.object({
    name: z.enum(["주간 아파트 가격동향", "보유세 계산기", "구매력 계산기", "집중 아파트 비교 리서치", "토탈 비용 시뮬레이션", "비트코인 참고 지표"]),
    reason: z.string(),
  })).max(3),
});

export async function POST(request: Request) {
  try {
    const body = await request.json() as { title?: string; category?: string; source?: string; text?: string };
    const text = body.text?.trim().slice(0, 45_000) ?? "";

    if (text.length < 40) {
      return Response.json({ error: "분석할 본문이 너무 짧습니다." }, { status: 400 });
    }

    let token = process.env.AI_GATEWAY_API_KEY;
    if (!token) {
      try {
        token = await getVercelOidcToken();
      } catch {
        token = undefined;
      }
    }
    if (!token) {
      return Response.json({ error: "AI 연결이 아직 활성화되지 않았습니다." }, { status: 503 });
    }

    const gateway = createGateway({ apiKey: token });
    const { output } = await generateText({
      model: gateway("openai/gpt-5.6-luna"),
      output: Output.object({ schema: analysisSchema }),
      system: `당신은 한국의 개인 투자자를 돕는 리서치 편집자다. 주어진 자료에 없는 사실을 만들지 말고, 불확실하면 반드시 '확인 필요'라고 쓴다. 모든 답변은 쉽고 짧은 한국어로 작성한다. 영향 분석은 사용자의 구체적인 자산 정보가 없다는 점을 전제로 일반적인 영향을 설명한다. 키워드는 명사 중심으로 중복 없이 뽑는다. 행동 제안은 당장 확인할 수 있는 구체적인 단계로 쓴다. 공포나 환호 한쪽에 치우치지 않도록 긍정·부정·중립 시각을 각각 제시한다. 원문에 네이버 블로그·뉴스 사이트의 검색창, 메뉴, 공감/댓글 숫자, 공유·레이어 닫기·이웃추가 같은 UI 문구가 섞여 있으면 모두 무시하고 실제 글 본문만 분석한다.`,
      prompt: `자료 제목: ${body.title || "제목 없음"}\n자료 종류: ${body.category || "기타"}\n출처: ${body.source || "미입력"}\n\n아래 자료를 요약하고, 핵심 인사이트와 키워드를 추출한 뒤 매매가·대출·세금·정책·시장심리에 미치는 영향을 구분해 분석하라. 같은 사실을 긍정적·부정적·중립적 시각에서 각각 해석하고, 마지막에는 '그래서 나는?'에 넣을 행동과 이 대시보드의 적절한 도구를 추천하라.\n\n--- 원문 ---\n${text}`,
    });

    return Response.json({ ...output, engine: "ai" });
  } catch (error) {
    console.error("research insight analysis failed", error);
    return Response.json({ error: "AI 분석 중 문제가 생겼습니다." }, { status: 500 });
  }
}
