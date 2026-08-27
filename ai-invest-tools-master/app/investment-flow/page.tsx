import FlowGuide from "./flow-guide";

export const metadata = { title: "투자 판단 플로우 V1 | AI 투자 도구 MASTER", description: "다섯 가지 투자 질문에 따라 필요한 도구와 다음 행동을 안내합니다." };

export default function InvestmentFlowPage() {
  return <main className="section-page"><header className="section-hero"><span>DECISION FLOW · V1</span><h1>투자 판단은<br /><em>질문부터.</em></h1><p>지금 고민을 고르면 확인할 자료와 도구를 순서대로 안내합니다.</p></header><FlowGuide /></main>;
}
