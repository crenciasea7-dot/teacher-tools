// lib/notion.js
// 투자 판단 OS — Notion 워크스페이스 조회 헬퍼.
// SDK(@notionhq/client) 의존성 없이 REST API 직접 호출 — 새 패키지 설치 불필요.

const NOTION_VERSION = "2022-06-28";
const NOTION_API = "https://api.notion.com/v1";

/**
 * 주어진 Notion 데이터베이스를 전부 조회해서(페이지네이션 포함) 원시 결과 배열로 반환.
 * @param {string} databaseId - 대시 포함/미포함 둘 다 허용
 */
export async function queryDatabase(databaseId) {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error(
      "NOTION_TOKEN 환경변수가 없습니다. Vercel 프로젝트 Settings → Environment Variables에서 등록하세요."
    );
  }

  const results = [];
  let cursor = undefined;

  do {
    const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }
      ),
      // Next.js 캐시: 1시간마다 재검증. 필요하면 숫자만 조정.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Notion 조회 실패 (${res.status}): ${detail}`);
    }

    const json = await res.json();
    results.push(...json.results);
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);

  return results;
}

// Notion property 하나를 사람이 읽기 쉬운 값으로 단순화.
function simplifyProperty(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case "title":
      return prop.title.map((t) => t.plain_text).join("");
    case "rich_text":
      return prop.rich_text.map((t) => t.plain_text).join("");
    case "select":
      return prop.select ? prop.select.name : null;
    case "multi_select":
      return prop.multi_select.map((o) => o.name);
    case "checkbox":
      return prop.checkbox;
    case "url":
      return prop.url;
    case "date":
      return prop.date ? { start: prop.date.start, end: prop.date.end } : null;
    case "relation":
      return prop.relation.map((r) => r.id);
    case "rollup":
      if (prop.rollup.type === "number") return prop.rollup.number;
      if (prop.rollup.type === "array") return prop.rollup.array.length;
      return null;
    default:
      return null;
  }
}

/**
 * Notion 페이지 객체(raw) → { id, url, ...properties } 형태의 평평한 객체로 변환.
 */
export function flattenPage(page) {
  const flat = { id: page.id, url: page.url };
  for (const [key, prop] of Object.entries(page.properties)) {
    flat[key] = simplifyProperty(prop);
  }
  return flat;
}

/** queryDatabase + flattenPage 를 한 번에. */
export async function fetchAndFlatten(databaseId) {
  const raw = await queryDatabase(databaseId);
  return raw.map(flattenPage);
}

const SOURCE_BANK_ID = "87b75ba5-2aee-4501-a31f-697eba133470";
export async function createSourcePage({ title, content, url }) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN 환경변수가 없습니다.");
  const children = content.split(/\n\n+/).filter(Boolean).slice(0, 80).map((text) => ({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }] } }));
  const schemaResponse = await fetch(`${NOTION_API}/databases/${SOURCE_BANK_ID}`, { headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION } });
  if (!schemaResponse.ok) throw new Error(`소스 뱅크 확인 실패 (${schemaResponse.status})`);
  const schema = await schemaResponse.json();
  const titleKey = Object.entries(schema.properties || {}).find(([, prop]) => prop.type === "title")?.[0] || "Name";
  const properties = { [titleKey]: { title: [{ type: "text", text: { content: title.slice(0, 200) } }] } };
  const urlKey = Object.entries(schema.properties || {}).find(([key, prop]) => prop.type === "url" && /url|출처|링크/i.test(key))?.[0];
  if (url && urlKey) properties[urlKey] = { url };
  const response = await fetch(`${NOTION_API}/pages`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" }, body: JSON.stringify({ parent: { database_id: SOURCE_BANK_ID }, properties, children }) });
  if (!response.ok) throw new Error(`Notion 저장 실패 (${response.status}): ${await response.text()}`);
  return response.json();
}
