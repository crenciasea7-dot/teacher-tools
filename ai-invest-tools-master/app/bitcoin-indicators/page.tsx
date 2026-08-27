import BitcoinDashboard from "./bitcoin-dashboard";

const flow = ["시장 심리", "장기 가격 위치", "비트코인 자금 집중", "스테이블코인 대기자금", "온체인 검증"];

export default function BitcoinIndicatorsPage() {
  return (
    <main className="bitcoin-page">
      <section className="bitcoin-hero">
        <a href="/" className="bitcoin-back">← AI 투자 도구 MASTER</a>
        <div className="bitcoin-kicker"><span>BITCOIN</span> DECISION BOARD</div>
        <h1>비트코인을 볼 때,<br/><em>무엇부터 봐야 할까?</em></h1>
        <p>다른 사이트로 이동하지 않고, 필요한 참고 지표를 이 화면에서 바로 확인합니다.</p>
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

      <BitcoinDashboard />

      <aside className="bitcoin-notice">
        <b>투자 판단 참고용</b>
        <p>각 지표는 계산 기준과 갱신 시간이 다릅니다. 한 지표만으로 매수·매도를 결정하지 말고 함께 비교하세요.</p>
      </aside>
    </main>
  );
}
