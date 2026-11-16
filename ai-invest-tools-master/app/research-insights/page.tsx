import Link from "next/link";
import ResearchWorkspace from "./research-workspace";

export const metadata = {
  title: "자료 정리 & 인사이트 | AI 투자 도구 MASTER",
  description: "자료를 올리고, Claude가 정리한 주장·근거·연결고리에 내 생각을 쌓는 개인 리서치 보드",
};

const INSIGHT_NOTE_URL = "https://incredible-cannoli-f92cd7.netlify.app/";

export default function ResearchInsightsPage() {
  return (
    <main className="research-page">
      <header className="research-hero">
        <Link href="/" className="research-back">← AI 투자 도구 MASTER</Link>
        <div>
          <span>RESEARCH MEMORY</span>
          <h1>자료 정리 <em>&</em><br />인사이트 축적</h1>
          <p>자료를 올리면 Claude가 주장·근거·연결고리를 뽑아두고, 나는 노란 칸에 내 생각을 쓴다. 그게 쌓이면 내 계기판과 내 모델이 된다.</p>
        </div>
        <aside>
          <b>📁 내 구글 시트·드라이브에 쌓임</b>
          <p>올린 자료는 구글 드라이브 클로드분석 폴더에, 생각과 판단기록은 구글 시트에 저장됩니다. 어느 기기에서 열어도, 어느 AI가 정리해도 같은 곳에 쌓입니다.</p>
        </aside>
      </header>

      <section style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <a href={INSIGHT_NOTE_URL} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#185c50", fontWeight: 700 }}>
            새 창에서 크게 열기 ↗
          </a>
        </div>
        <iframe
          src={INSIGHT_NOTE_URL}
          title="인사이트 노트"
          allow="clipboard-write"
          style={{
            width: "100%",
            height: "calc(100vh - 140px)",
            minHeight: 820,
            border: "1px solid #e3e1d8",
            borderRadius: 20,
            background: "#f5f4ef",
          }}
        />
      </section>

      <details style={{ marginTop: 28 }}>
        <summary style={{ cursor: "pointer", color: "#5f766f", fontSize: 13, fontWeight: 700 }}>
          이전 자료 정리 기록 보기 (이 기기 브라우저에 저장된 것)
        </summary>
        <ResearchWorkspace />
      </details>
    </main>
  );
}
