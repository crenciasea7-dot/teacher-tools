import GoldTracker from "./gold-tracker";

export const metadata = { title: "자산 추적 V1 | AI 투자 도구 MASTER", description: "moyo 자산보드와 금 보유량·손익을 함께 확인합니다." };

export default function AssetTrackingPage() {
  return <main className="section-page"><header className="section-hero"><span>PRIVATE ASSET TRACKING · V1</span><h1>내 자산은<br /><em>내 기기에.</em></h1><p>전체 자산은 moyo에서 관리하고, 금 보유량과 손익은 이 기기에서 빠르게 추적합니다.</p></header><section className="moyo-entry"><div><span>MOYO PRIVATE BOARD</span><h2>부동산·금융자산·현금 한눈에 보기</h2><p>로그인한 계정의 개인 자산보드로 이동합니다.</p></div><a href="https://moyo-private-asset-dashboard.crenciasea7.chatgpt.site/" target="_blank" rel="noreferrer">moyo 열기 →</a></section><GoldTracker /></main>;
}
