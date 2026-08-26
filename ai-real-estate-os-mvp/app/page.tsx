import { ConversationWorkspace } from "./components/conversation-workspace";
import { SiteHeader } from "./components/site-header";
import Link from "next/link";

const purposes = [
  ["/buy", "매수", "살 집의 적정가격과 협상 범위를 점검해요", "↘"],
  ["/sell", "매도", "우리 집의 호가 경쟁력과 다음 행동을 찾아요", "↗"],
  ["/redevelopment", "재개발 매물 분석", "받은 설명과 캡처에서 필요현금·권리 질문을 정리해요", "⌁"],
  ["/capture", "매물 비교", "여러 장의 광고 캡처를 한 번에 비교해요", "▧"],
  ["/automation", "자동화", "통화·임장·매물변화를 반복 가능한 흐름으로 만들어요", "◎"],
] as const;

const showroomTools = [
  { name:"보유세 계산기", icon:"稅", description:"공시가격과 명의 조건으로 2026~2028 보유세를 비교해요.", href:"https://property-tax-verified.vercel.app/", access:"공개", verify:"세율·공제 검증 중", featured:true },
  { name:"아파트 잔금대출 계산기", icon:"貸", description:"분양가·납부액·소득·기존 대출로 잔금 필요자금을 점검해요.", href:"https://jip-jangeum-calculator.crenciasea7.chatgpt.site", access:"로그인형", verify:"대출 규정 검증 중", featured:true },
  { name:"구매력 역계산기", icon:"₩", description:"자기자금과 연소득으로 감당 가능한 주택가격을 역산해요.", href:"https://purchasing-power-calculator.vercel.app/", access:"공개", verify:"공개 실행" },
  { name:"R-ONE 주간 상승률 대시보드", icon:"↗", description:"서울·경기·인천 매매·전세의 주간 흐름을 비교해요.", href:"https://rone-weekly-capital-dashboard.vercel.app/", access:"공개", verify:"실제 데이터 검증 중" },
  { name:"인가 레이더 서울", icon:"波", description:"재개발·재건축 인가 신호와 규제 위험을 구분해요.", href:"https://inga-radar-seoul.vercel.app/", access:"공개", verify:"공식자료 검증 중", featured:true },
  { name:"집중 — 아파트 비교 리서치", icon:"集", description:"조건에 맞는 아파트 3곳과 시세·매물·임장 항목을 비교해요.", href:"https://jipjung-apartment-research.crenciasea7.chatgpt.site", access:"로그인형", verify:"본인 계정 필요" },
  { name:"AI 투자 거울", icon:"鏡", description:"세후수익·가설·행동편향·반대 시나리오를 함께 점검해요.", href:"https://ai-investment-mirror.crenciasea7.chatgpt.site", access:"로그인형", verify:"본인 계정 필요" },
] as const;

export default function HomePage() {
  return <main><SiteHeader />
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">AI REAL ESTATE WORKSHOP</span><h1>입력칸 대신,<br/><em>그냥 상황을 말해보세요.</em></h1><p>집값연구소가 자연어와 자료를 읽고, 사실·광고·계산·추정을 구분해 다음 행동까지 정리합니다.</p><div className="trust-row"><span>✓ 로그인 없음</span><span>✓ 로컬 우선</span><span>✓ 출처·확인일 표시</span></div></div>
      <div className="hero-orbit" aria-hidden="true"><div className="orbit-core">AI<span>대화로 시작</span></div><span className="orbit o1">가격</span><span className="orbit o2">초투</span><span className="orbit o3">캡처</span><span className="orbit o4">근거</span></div>
    </section>
    <section className="purpose-section"><div className="section-heading"><span>01</span><div><h2>원하는 작업을 고르세요</h2><p>선택하지 않아도 대화에서 자동으로 판별합니다.</p></div></div><div className="purpose-grid">{purposes.map(([href,title,desc,icon]) => <Link href={href} key={href}><span className="purpose-icon">{icon}</span><strong>{title}</strong><p>{desc}</p><em>작업실 열기 →</em></Link>)}</div></section>
    <ConversationWorkspace compact kind="home" />
    <section className="showroom" id="tools-showroom">
      <div className="showroom-heading"><div><span className="eyebrow">BUILT WITH AI · USED IN PRACTICE</span><h2>제가 AI로 만든 투자 도구들</h2><p>비개발자인 강사가 실제 필요에서 시작해 만든 도구입니다. 공개 범위와 검증 상태를 그대로 표시합니다.</p></div><a href="https://app.notion.com/p/3bf8d732d58e81adaac2ddeb9357f0a4" target="_blank" rel="noreferrer">전체 작업 기록 보기 ↗</a></div>
      <div className="showroom-grid">{showroomTools.map((tool,index)=><article className={tool.featured?"featured":""} key={tool.name}><div className="tool-top"><span className="tool-number">0{index+1}</span><span className="tool-icon">{tool.icon}</span></div><div className="tool-status"><span className={tool.access==="공개"?"public":"login"}>{tool.access}</span><span className="verify">{tool.verify}</span></div><h3>{tool.name}</h3><p>{tool.description}</p><a href={tool.href} target="_blank" rel="noreferrer">실행하기 <span>↗</span></a></article>)}</div>
    </section>
    <section className="principles"><div><span>사실</span><strong>사용자·공식자료</strong></div><div><span>광고</span><strong>매물 문구 그대로</strong></div><div><span>계산</span><strong>산식과 입력값 공개</strong></div><div><span>추정</span><strong>확신도와 한계 표시</strong></div><div><span>확인</span><strong>전문가·관공서 질문</strong></div></section>
  </main>;
}
