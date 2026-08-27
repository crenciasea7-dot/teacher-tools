import Link from "next/link";
import ResearchWorkspace from "./research-workspace";

export const metadata = {
  title: "자료 정리 & 인사이트 | AI 투자 도구 MASTER",
  description: "보고서와 정책 자료를 요약하고 투자 인사이트와 행동으로 축적하는 개인 리서치 보드",
};

export default function ResearchInsightsPage() {
  return (
    <main className="research-page">
      <header className="research-hero">
        <Link href="/" className="research-back">← AI 투자 도구 MASTER</Link>
        <div>
          <span>RESEARCH MEMORY</span>
          <h1>자료 정리 <em>&</em><br />인사이트 축적</h1>
          <p>머리 아픈 자료를 넣으면 요약부터 영향 분석, 다음 행동까지 한 번에 정리합니다.</p>
        </div>
        <aside>
          <b>🔒 원본은 이 기기에만</b>
          <p>원본 파일과 분석 기록은 현재 브라우저에 저장됩니다. AI 분석 시 추출된 텍스트만 일시적으로 전송되며 서버에 보관하지 않습니다.</p>
        </aside>
      </header>
      <ResearchWorkspace />
    </main>
  );
}
