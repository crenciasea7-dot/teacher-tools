import "../tool-pages.css";

const calculators = [
  { name: "세무통 보유세 계산기", description: "가장 먼저 확인할 보유세 시뮬레이터", url: "https://www.semutong.com/ai/calculator/holding-tax-simulator", primary: true },
  { name: "부동산계산기 보유세", description: "다른 기준으로 한 번 더 교차 확인", url: "https://xn--989a00af8jnslv3dba.com/%EB%B3%B4%EC%9C%A0%EC%84%B8" },
  { name: "PropertyTax 보유세", description: "추가 계산기로 결과 비교", url: "https://propertytax.co.kr/" },
];

export default function PropertyTaxPage() {
  return (
    <main className="public-tool-page public-link-hub">
      <a className="tool-back" href="/">← AI 투자 도구 MASTER</a>
      <section className="tool-intro">
        <p>PROPERTY TAX HUB</p>
        <h1>보유세 계산기</h1>
        <span>로그인 없이 세무통을 바로 열고, 다른 계산기와 결과를 비교하세요.</span>
      </section>
      <section className="link-hub-grid">
        {calculators.map((calculator) => (
          <a className={calculator.primary ? "link-hub-card primary" : "link-hub-card"} href={calculator.url} target="_blank" rel="noreferrer" key={calculator.name}>
            <span>{calculator.primary ? "추천 · 외부 업체" : "외부 업체"}</span>
            <h2>{calculator.name}</h2>
            <p>{calculator.description}</p>
            <b>계산기 열기 ↗</b>
          </a>
        ))}
      </section>
      <p className="tool-disclaimer">계산 결과는 참고용입니다. 실제 세액은 보유 현황과 적용 시점의 세법에 따라 달라질 수 있습니다.</p>
    </main>
  );
}
