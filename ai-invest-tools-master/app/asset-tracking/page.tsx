export const metadata = {
  title: "자산 포트폴리오 현황 | AI 투자 도구 MASTER",
  description: "부동산·금융자산·현금 비중을 한눈에 확인합니다.",
};

export default function AssetTrackingPage() {
  return (
    <main className="section-page portfolio-page">
      <header className="section-hero">
        <span>PRIVATE ASSET TRACKING · V1</span>
        <h1>내 자산은<br /><em>내 계정에.</em></h1>
        <p>부동산·금융자산·현금 현황은 moyo 개인 자산보드에서 관리합니다.</p>
      </header>

      <a
        className="portfolio-card"
        href="https://moyo-private-asset-dashboard.crenciasea7.chatgpt.site/"
        target="_blank"
        rel="noreferrer"
      >
        <div className="portfolio-text">
          <span>MOYO PRIVATE BOARD</span>
          <h2>자산 포트폴리오 현황</h2>
          <p>부동산·주식·현금 등 내 자산을 입력하고<br />전체 자산의 비중을 한눈에 확인해 보세요.</p>

          <div className="legend">
            <b><i className="yellow" />부동산</b>
            <b><i className="green" />주식</b>
            <b><i className="blue" />현금</b>
            <b><i className="purple" />기타</b>
          </div>

          <strong className="open-button">내 자산 비중 확인하기 →</strong>
        </div>

        <div className="chart-area">
          <div className="donut">
            <div><small>전체 자산</small><strong>100%</strong></div>
          </div>
          <b className="percent p1">38%</b>
          <b className="percent p2">24%</b>
          <b className="percent p3">14%</b>
        </div>
      </a>

      <style>{`
        .portfolio-page{padding-bottom:70px}
        .portfolio-card{display:grid;grid-template-columns:1.3fr .7fr;align-items:center;gap:55px;min-height:390px;margin-top:30px;padding:55px 65px;border-radius:32px;background:linear-gradient(135deg,#102d2a,#16473f);color:white;text-decoration:none;box-shadow:0 25px 65px #0c2f2833;transition:.2s}
        .portfolio-card:hover{transform:translateY(-6px);box-shadow:0 32px 75px #0c2f2844}
        .portfolio-text>span{color:#70d8c0;font:600 11px "DM Mono",monospace;letter-spacing:.16em}
        .portfolio-text h2{margin:16px 0;font-size:clamp(36px,4.5vw,58px);letter-spacing:-.06em}
        .portfolio-text p{margin:0;color:#c8dcd7;font-size:17px;line-height:1.7}
        .legend{display:flex;flex-wrap:wrap;gap:12px 20px;margin:25px 0}
        .legend b{display:flex;align-items:center;gap:7px;font-size:12px}
        .legend i{width:11px;height:11px;border-radius:50%}
        .yellow{background:#f1bd3b}.green{background:#42a267}.blue{background:#485eb5}.purple{background:#9a3bb0}
        .open-button{display:inline-block;margin-top:8px;padding:16px 21px;border-radius:14px;background:white;color:#12332e;font-size:15px}
        .chart-area{position:relative;display:grid;place-items:center}
        .donut{display:grid;place-items:center;width:270px;height:270px;border-radius:50%;background:conic-gradient(#e85747 0 3%,#485eb5 3% 15%,#c8c72f 15% 28%,#9a3bb0 28% 32%,#49aec0 32% 37%,#ed6a2f 37% 41%,#42a267 41% 65%,#f1bd3b 65% 100%);box-shadow:0 24px 45px #0005}
        .donut:after{content:"";width:52%;height:52%;border-radius:50%;background:#143832}
        .donut>div{position:absolute;z-index:2;display:grid;text-align:center}
        .donut small{color:#9fc2b8}.donut strong{font-size:25px}
        .percent{position:absolute;padding:9px 12px;border-radius:99px;background:white;color:#173b35;font-size:12px;box-shadow:0 8px 18px #0003}
        .p1{top:15px;right:0}.p2{right:5px;bottom:15px}.p3{top:35px;left:-10px}
        @media(max-width:760px){.portfolio-card{grid-template-columns:1fr;padding:35px 25px}.chart-area{order:-1}.donut{width:220px;height:220px}.portfolio-text p br{display:none}}
      `}</style>
    </main>
  );
}
