import GoldTracker from "../asset-tracking/gold-tracker";

export const metadata = { title: "포트폴리오 리벨런싱 V1 | AI 투자 도구 MASTER", description: "국장·미장과 주식·부동산의 기회비용을 비교합니다." };

export default function RebalancingPage() {
  return <main className="section-page"><header className="section-hero"><span>PORTFOLIO REBALANCING · V1</span><h1>무엇을 살지보다<br /><em>무엇을 줄일지.</em></h1><p>금·주식·부동산의 세금·비용·시간을 포함해 자산 간 기회비용을 비교합니다.</p></header><div id="gold-tracker"><GoldTracker /></div><section className="rebalancing-grid"><a href="https://simplewoody.com/ko/investment/investment-tax-cost.html" target="_blank" rel="noreferrer"><i>01</i><span>AVAILABLE · 외부 업체</span><h2>국장이냐 미장이냐</h2><p>세금을 고려해 국내주식과 미국주식의 실제 투자비용을 비교합니다.</p><b>비교 도구 열기 ↗</b></a><article><i>02</i><span>PREPARING</span><h2>주식이냐 부동산이냐</h2><p>기대수익·변동성·현금흐름·레버리지·시간비용을 같은 기준으로 비교할 예정입니다.</p><b>V1 준비 중</b></article></section><blockquote className="balance-rule">공포 때문에 모두 팔지 말고, 환호 때문에 한 자산에 몰지 말 것.</blockquote></main>;
}
