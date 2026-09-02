const posts = [
  { tag: "투자 원칙", title: "지표는 예언이 아니라 현재 위치다", summary: "공포탐욕·금리·환율을 한 숫자로 결론내리지 않고 서로 확인하는 방법", href: "/investment-flow" },
  { tag: "부동산", title: "집값보다 먼저 총비용을 계산해야 하는 이유", summary: "취득비용·대출·보유비용·출구전략을 매수 전에 한 번에 보는 체크리스트", href: "/property-purchase-simulation" },
  { tag: "시장 읽기", title: "주간 아파트 가격동향 그래프", summary: "한국부동산원 공식 주간 수치를 지역별 그래프로 확인", href: "https://rone-weekly-capital-dashboard.vercel.app/" },
  { tag: "자료 관리", title: "좋은 자료보다 반복되는 신호가 중요하다", summary: "보고서와 정책을 누적해 주간·월간 패턴으로 바꾸는 개인 리서치 습관", href: "/research-insights" },
];

export const metadata = { title: "블로그·인사이트 V1 | AI 투자 도구 MASTER", description: "흔들리지 않는 투자 판단을 위한 실전 가이드" };

export default function InsightsPage() {
  return <main className="section-page"><header className="section-hero"><span>MOYO INVESTMENT NOTES · V1</span><h1>환호도 공포도<br /><em>근거는 아니다.</em></h1><p>도구를 만드는 과정에서 정리한 투자 원칙과 실전 가이드입니다.</p></header><section className="insight-posts">{posts.map((post, index) => <a href={post.href} key={post.title}><i>{String(index + 1).padStart(2, "0")}</i><span>{post.tag}</span><h2>{post.title}</h2><p>{post.summary}</p><b>관련 가이드 보기 →</b></a>)}</section></main>;
}
