import { createGateway, generateText } from "ai";
import { getVercelOidcToken } from "@vercel/oidc";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { question, knowledge = [] } = await request.json();
    const q = String(question || "").trim();
    if (!q) return Response.json({ error: "판단할 질문을 입력해 주세요." }, { status: 400 });
    const context = (Array.isArray(knowledge) ? knowledge : []).slice(0, 40).map((r: Record<string, unknown>) =>
      `- [${String(r["근거수준"] || "KNOWLEDGE")}] ${String(r["Rule ID/제목"] || r["원칙/쟁점 ID"] || "지식 카드")}: ${String(r["판단"] || r["설명"] || r["상황"] || "")}`
    ).join("\n");
    const prompt = `당신은 투자 판단 OS의 의사결정 엔진이다. 자료에 없는 사실과 확정적 수익 예측은 만들지 않는다. 부족한 정보는 확인 필요라고 쓴다. 인플루언서 말투를 흉내 내지 말고 근거와 반대근거를 함께 제시한다.

사용자 질문:\n${q}

연결된 Knowledge Universe:\n${context || "연결된 카드 없음"}

한국어로 다음 10개 항목을 작성하라: 1) 한줄 결론 2) 현재 상황 3) 핵심 신호 4) 판단 근거 5) 반대 근거와 리스크 6) 지금 할 일 7) 하지 말아야 할 일 8) 다음 확인 트리거 9) 판단 무효화 조건 10) 사용한 지식 카드.`;
    const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY || await getVercelOidcToken().catch(() => null);
    if (!token) return Response.json({ error: "AI Gateway 환경변수가 아직 설정되지 않았습니다." }, { status: 503 });
    const gateway = createGateway({ apiKey: token });
    const result = await generateText({ model: gateway("openai/gpt-5.4"), prompt });
    return Response.json({ answer: result.text, engine: "ai-gateway" });
  } catch (error) {
    console.error("investment decision failed", error);
    return Response.json({ error: "AI 판단 중 문제가 생겼습니다." }, { status: 500 });
  }
}
