import { createSourcePage } from "../../../lib/notion";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.title || !body.content) return Response.json({ error: "title과 content가 필요합니다." }, { status: 400 });
    const page = await createSourcePage({ title: body.title, content: body.content, url: body.url });
    return Response.json({ ok: true, id: page.id, url: page.url });
  } catch (error) {
    console.error("[save-source] Notion 저장 실패:", error);
    return Response.json({ error: error instanceof Error ? error.message : "unknown error" }, { status: 500 });
  }
}
