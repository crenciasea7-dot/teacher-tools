import { createGateway, generateText, Output } from "ai";
import { getVercelOidcToken } from "@vercel/oidc";
import { z } from "zod";
import { hasAdminSession } from "../../../lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const impactItem = z.object({
  direction: z.enum(["positive", "neutral", "negative", "uncertain"]),
  detail: z.string(),
});

const analysisSchema = z.object({
  summary: z.string(),
  insights: z.array(z.string()).min(4).max(10),
  keywords: z.array(z.object({ word: z.string(), weight: z.number().int().min(1).max(10) })).min(6).max(20),
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
  actions: z.array(z.string()).min(3).max(8),
  recommendedTools: z.array(z.object({
    name: z.enum(["주간 아파트 가격동향", "보유세 계산기", "구매력 계산기", "집중 아파트 비교 리서치", "토탈 비용 시뮬레이션", "비트코인 참고 지표"]),
    reason: z.string(),
  })).max(3),
});

const dailyUsage = new Map<string, { day: string; count: number }>();

function buildAnalysisPrompt(body: { title?: string; category?: string; source?: string }, text?: string) {
  const sourceText = text ? `\n\n--- 원문 ---\n${text}` : "";
  return `당신은 한국 부동산·금융시장 자료를 읽는 투자 리서치 편집자다.

목표:
- 단순 요약이 아니라, 이 자료가 "무슨 말이고, 투자자가 어떻게 써먹을지"까지 정리한다.
- 원문에 없는 사실은 만들지 말고, 불확실하면 반드시 "확인 필요"라고 쓴다.
- OCR로 깨진 글자, 페이지 번호, 메뉴, 검색창, 공유, 댓글, UI 문구는 버린다.
- 숫자, 시점, 정책명, 세금·대출 조건, 금리·통화량·공급 같은 핵심 변수는 최대한 살린다.
- 원문이 보고서/강의자료/PDF라면 목차 흐름을 복원해서 설명한다.
- 사용자에게 필요한 수준은 NotebookLM/LilysAI식 브리핑이다. 짧은 한 줄 요약으로 끝내지 않는다.

출력 수준:
- summary: 전체 결론을 8~12문장으로 쓴다. "이 보고서가 무엇을 말하는지"와 "왜 지금 중요한지"가 보여야 한다.
- insights: 목차별 주요 메시지처럼 6~10개를 뽑는다. 각 항목은 최소 2문장으로 쓰고, "핵심 주장 + 근거/맥락 + 투자적 의미" 순서로 쓴다.
- impact: 매매가, 대출, 세금, 정책, 시장심리에 각각 어떤 압력/기회/주의점이 있는지 2~4문장으로 구분한다.
- perspectives: 같은 자료를 긍정·부정·중립으로 다르게 해석하되, 각 시각을 3~5문장으로 쓴다.
- actions: "그래서 나는?"에 들어갈 행동 체크리스트를 5~8개 쓴다. 바로 확인할 데이터, 적용할 자산, 다음 의사결정을 포함한다.
- recommendedTools: 이 대시보드에서 이어서 볼 도구를 추천한다.

자료 제목: ${body.title || "제목 없음"}
자료 종류: ${body.category || "기타"}
출처: ${body.source || "미입력"}${sourceText}`;
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("AI 응답을 JSON으로 읽지 못했습니다.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateWithGemini(prompt: string, file?: File) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) throw new Error("Gemini key missing");
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: `${prompt}

반드시 아래 JSON 형식만 반환하세요. 마크다운 설명은 쓰지 마세요.
{
  "summary": "전체 결론 8~12문장. 보고서의 핵심 주장, 근거, 투자자가 써먹을 지점을 충분히 설명",
  "insights": ["목차별 핵심 메시지. 최소 2문장으로 핵심 주장 + 근거/맥락 + 투자적 의미를 작성", "시장 변수와 투자 해석"],
  "keywords": [{"word": "키워드", "weight": 8}],
  "impact": {
    "salePrice": {"direction": "positive|neutral|negative|uncertain", "detail": "매매가 영향 2~4문장"},
    "loan": {"direction": "positive|neutral|negative|uncertain", "detail": "대출 영향 2~4문장"},
    "tax": {"direction": "positive|neutral|negative|uncertain", "detail": "세금 영향 2~4문장"},
    "policy": {"direction": "positive|neutral|negative|uncertain", "detail": "정책 영향 2~4문장"},
    "sentiment": {"direction": "positive|neutral|negative|uncertain", "detail": "시장심리 영향 2~4문장"}
  },
  "perspectives": {
    "positive": "긍정적 해석 3~5문장",
    "negative": "부정적 해석 3~5문장",
    "neutral": "중립적 해석 3~5문장"
  },
  "actions": ["투자자가 다음에 확인할 행동 1", "투자자가 다음에 확인할 행동 2", "투자자가 다음에 확인할 행동 3"],
  "recommendedTools": [{"name": "주간 아파트 가격동향", "reason": "추천 이유"}]
}` }];

  if (file) {
    const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
    parts.push({ inlineData: { mimeType: file.type || "application/octet-stream", data: bytes } });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
      contents: [{
        role: "user",
        parts,
      }],
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || "Gemini 분석 호출에 실패했습니다.");
  const text = body.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("\n") || "";
  return analysisSchema.parse(extractJson(text));
}

export async function POST(request: Request) {
  try {
    const admin = await hasAdminSession();
    if (!admin) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const day = new Date().toISOString().slice(0, 10);
      const limit = Math.max(1, Number(process.env.PUBLIC_AI_DAILY_LIMIT_PER_IP || 10));
      const usage = dailyUsage.get(ip);
      const count = usage?.day === day ? usage.count : 0;
      if (count >= limit) return Response.json({ error: "오늘 AI 요약 사용 한도를 초과했습니다. 내일 다시 시도해주세요." }, { status: 429 });
      dailyUsage.set(ip, { day, count: count + 1 });
    }
    const contentType = request.headers.get("content-type") || "";
    let body: { title?: string; category?: string; source?: string; text?: string };
    let file: File | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      body = {
        title: String(form.get("title") || ""),
        category: String(form.get("category") || ""),
        source: String(form.get("source") || ""),
        text: String(form.get("text") || ""),
      };
      const uploaded = form.get("file");
      if (uploaded instanceof File) file = uploaded;
    } else {
      body = await request.json() as { title?: string; category?: string; source?: string; text?: string };
    }

    const text = body.text?.trim().slice(0, 45_000) ?? "";

    if (!file && text.length < 40) {
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
    if (!token && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json({ error: "AI 연결이 아직 활성화되지 않았습니다." }, { status: 503 });
    }

    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const analysisPrompt = buildAnalysisPrompt(body, file ? undefined : text);

    if (file) {
      if (!hasGeminiKey) {
        return Response.json({ error: "PDF 원본 분석에는 GEMINI_API_KEY 또는 GOOGLE_GENERATIVE_AI_API_KEY가 Production 환경변수에 필요합니다." }, { status: 503 });
      }
      const output = await generateWithGemini(analysisPrompt, file);
      return Response.json({ ...output, engine: "ai" });
    }

    try {
      if (!token) throw new Error("AI Gateway token missing");
      const gateway = createGateway({ apiKey: token });
      const { output } = await generateText({
        model: gateway("openai/gpt-5.6-luna"),
        output: Output.object({ schema: analysisSchema }),
        prompt: analysisPrompt,
      });

      return Response.json({ ...output, engine: "ai" });
    } catch (gatewayError) {
      if (!hasGeminiKey) throw gatewayError;
      console.warn("AI Gateway failed, falling back to Gemini", gatewayError);
      const output = await generateWithGemini(analysisPrompt, file);
      return Response.json({ ...output, engine: "ai" });
    }
  } catch (error) {
    console.error("research insight analysis failed", error);
    return Response.json({ error: "AI 분석 중 문제가 생겼습니다." }, { status: 500 });
  }
}
