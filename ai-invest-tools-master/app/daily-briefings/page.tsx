import dailyBriefs from "../data/daily-briefs.json";
import "./daily-briefings.css";

export const metadata = {
  title: "매일 AI 브리핑 | AI 투자 도구 MASTER",
  description: "출근길 아침 비서와 금리 재인상 위험 체크의 최신 브리핑",
};

export default function DailyBriefingsPage() {
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(dailyBriefs.updatedAt));

  return (
    <main className="briefing-page">
      <a className="briefing-back" href="/">← AI 투자 도구 MASTER</a>
      <header className="briefing-hero">
        <p>DAILY AI INTELLIGENCE</p>
        <h1>매일 쌓이는 시장 판단,<br /><em>한 페이지에서.</em></h1>
        <span>출근길 아침 비서와 금리 재인상 위험 체크의 최신 결과입니다.<br />마지막 동기화 {updatedAt}</span>
      </header>
      <nav className="briefing-nav" aria-label="브리핑 바로가기">
        {dailyBriefs.briefs.map((brief) => <a href={`#${brief.id}`} key={brief.id}><b>{brief.shortTitle}</b><span>{brief.status}</span></a>)}
      </nav>
      {dailyBriefs.briefs.map((brief) => (
        <article className={`briefing-report ${brief.id}`} id={brief.id} key={brief.id}>
          <div className="briefing-title">
            <div><span>{brief.dateLabel} · DAILY REPORT</span><h2>{brief.title}</h2></div>
            <b>{brief.status}</b>
          </div>
          <p className="briefing-summary">{brief.summary}</p>
          <section className="briefing-highlights">
            <h3>오늘의 핵심 신호</h3>
            <ul>{brief.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
          </section>
          <div className="briefing-sections">
            {brief.sections.map((section, index) => (
              <section key={section.heading}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{section.heading}</h3>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
              </section>
            ))}
          </div>
        </article>
      ))}
      <footer className="briefing-footer">AI 분석은 사실 확인과 투자 판단을 돕기 위한 참고 자료이며 투자 권유가 아닙니다.</footer>
    </main>
  );
}
