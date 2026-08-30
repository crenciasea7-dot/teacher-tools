import { lookup } from "node:dns/promises";

function isPrivateIp(ip: string) { return /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip) || ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:"); }

function cleanHtml(html: string) {
  const article = html.match(/<(?:div|article)[^>]+class=["'][^"']*(?:se-main-container|postViewArea)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|article)>/i)?.[0] ?? html;
  return article.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<(?:nav|header|footer|aside|form)[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|form)>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").replace(/(?:레이어 닫기|블로그 아이디가 필요해요!?|이웃과 소식을 만나보세요|공감\s*\d+|댓글\s*\d+|공유하기)/g, " ").replace(/\s+/g, " ").trim();
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json() as { url?: string };
    if (!url || !/^https?:\/\//i.test(url)) return Response.json({ error: "http(s) URL을 입력해 주세요." }, { status: 400 });
    const parsed = new URL(url);
    const allowed = /(^|\.)((m\.)?blog\.naver\.com|news\.naver\.com|n\.news\.naver\.com|mk\.co\.kr|hankyung\.com|sedaily\.com|chosun\.com|joongang\.co\.kr|khan\.co\.kr)$/i.test(parsed.hostname);
    if (!allowed) return Response.json({ error: "현재 네이버 블로그와 등록된 공개 뉴스 사이트만 자동 가져올 수 있습니다. 본문을 직접 붙여넣어 주세요." }, { status: 400 });
    const resolved = await lookup(parsed.hostname);
    if (isPrivateIp(resolved.address)) return Response.json({ error: "공개 인터넷 주소만 가져올 수 있습니다." }, { status: 400 });
    let target = url;
    if (/((m\.)?blog\.naver\.com)$/i.test(parsed.hostname)) {
      const [blogId, logNo] = parsed.pathname.split("/").filter(Boolean);
      if (blogId && logNo) target = `https://blog.naver.com/PostView.naver?blogId=${encodeURIComponent(blogId)}&logNo=${encodeURIComponent(logNo)}`;
    }
    const response = await fetch(target, { redirect: "error", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`페이지를 가져오지 못했습니다 (${response.status})`);
    const text = cleanHtml(await response.text());
    if (text.length < 80) throw new Error("본문을 찾지 못했습니다.");
    return Response.json({ text: text.slice(0, 45_000), source: url });
  } catch (error) { return Response.json({ error: "자동으로 가져오지 못했습니다. 본문을 직접 붙여넣어 주세요." }, { status: 502 }); }
}
