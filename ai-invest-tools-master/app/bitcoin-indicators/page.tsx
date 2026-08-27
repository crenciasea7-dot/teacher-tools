const indicators = [
  {
    step: "01",
    icon: "◎",
    name: "Fear & Greed Index",
    koreanName: "크립토 공포·탐욕 지수",
    description: "시장 참여자의 공포와 탐욕 수준을 0~100으로 확인합니다.",
    insight: "극단적 공포는 분할 관찰 구간, 극단적 탐욕은 과열 여부를 점검하는 신호로 봅니다.",
    url: "https://alternative.me/crypto/fear-and-greed-index/",
    source: "Alternative.me",
  },
  {
    step: "02",
    icon: "◒",
    name: "Bitcoin Rainbow Chart",
    koreanName: "비트코인 레인보우 차트",
    description: "비트코인의 장기 가격 위치를 색상 밴드로 살펴봅니다.",
    insight: "단기 매매 신호가 아니라 장기 밸류에이션의 과열·침체 위치를 확인하는 참고 도구입니다.",
    url: "https://www.blockchaincenter.net/bitcoin-rainbow-chart/",
    source: "BlockchainCenter",
  },
  {
    step: "03",
    icon: "₿",
    name: "Bitcoin Dominance",
    koreanName: "비트코인 도미넌스",
    description: "전체 암호화폐 시가총액에서 비트코인이 차지하는 비중을 확인합니다.",
    insight: "BTC.D 상승은 비트코인 집중, 하락은 알트코인으로 자금이 확산되는 흐름인지 점검합니다.",
    url: "https://kr.tradingview.com/chart/eaHfEkLG/",
    source: "TradingView",
  },
  {
    step: "04",
    icon: "₮",
    name: "Tether Dominance",
    koreanName: "테더 도미넌스",
    description: "암호화폐 시장에서 스테이블코인 대기자금의 비중을 확인합니다.",
    insight: "USDT.D 상승은 위험 회피, 하락은 대기자금이 암호화폐로 이동하는 흐름인지 함께 봅니다.",
    url: "https://kr.tradingview.com/chart/eaHfEkLG/",
    source: "TradingView",
  },
  {
    step: "05",
    icon: "◇",
    name: "Glassnode Analysis",
    koreanName: "글래스노드 온체인 분석",
    description: "거래소·보유자·네트워크 데이터를 통해 가격 밖의 움직임을 확인합니다.",
    insight: "마지막 단계에서 온체인 지표가 앞선 네 가지 판단을 뒷받침하는지 검증합니다.",
    url: "https://studio.glassnode.com/charts/178a2882-7af5-4b6b-5764-b4702e631acb",
    source: "Glassnode · 로그인이 필요할 수 있음",
  },
] as const;

const flow = ["시장 심리", "장기 가격 위치", "비트코인 자금 집중", "스테이블코인 대기자금", "온체인 검증"];

export default function BitcoinIndicatorsPage() {
  return (
    <main className="bitcoin-page">
      <section className="bitcoin-hero">
        <a href="/" className="bitcoin-back">← AI 투자 도구 MASTER</a>
        <div className="bitcoin-kicker"><span>BITCOIN</span> DECISION BOARD</div>
        <h1>비트코인을 볼 때,<br/><em>무엇부터 봐야 할까?</em></h1>
        <p>한 지표만 믿지 않고 시장 심리부터 온체인 데이터까지 순서대로 점검하는 참고 보드입니다.</p>
      </section>

      <section className="bitcoin-flow" aria-labelledby="bitcoin-flow-title">
        <div>
          <span>INVESTMENT FLOW</span>
          <h2 id="bitcoin-flow-title">암호화폐 판단 플로우</h2>
          <p>왼쪽부터 차례로 확인하면 시장의 온도와 자금 흐름을 놓치지 않습니다.</p>
        </div>
        <ol>
          {flow.map((label, index) => (
            <li key={label}><b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span></li>
          ))}
        </ol>
      </section>

      <section className="bitcoin-indicators" aria-label="비트코인 참고 지표">
        {indicators.map((indicator) => (
          <article className="bitcoin-indicator" key={indicator.name}>
            <div className="bitcoin-indicator-top">
              <span>{indicator.step}</span>
              <i>{indicator.icon}</i>
              <small>외부 업체</small>
            </div>
            <div className="bitcoin-indicator-copy">
              <p>{indicator.name}</p>
              <h2>{indicator.koreanName}</h2>
              <span>{indicator.description}</span>
            </div>
            <div className="bitcoin-insight">
              <b>해석 포인트</b>
              <p>{indicator.insight}</p>
            </div>
            <a href={indicator.url} target="_blank" rel="noreferrer" aria-label={`${indicator.koreanName} 외부 사이트 열기`}>
              <span>{indicator.source}</span><b>사이트 열기 ↗</b>
            </a>
          </article>
        ))}
      </section>

      <aside className="bitcoin-notice">
        <b>투자 판단 참고용</b>
        <p>각 지표는 서로 다른 시간대와 시장 데이터를 사용합니다. 한 지표만으로 매수·매도를 결정하지 말고 함께 비교하세요.</p>
      </aside>
    </main>
  );
}
