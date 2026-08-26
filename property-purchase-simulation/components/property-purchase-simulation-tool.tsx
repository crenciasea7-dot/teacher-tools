"use client";

import { useMemo, useState } from "react";

type HouseCount = 0 | 1 | 2 | 3;

const number = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

function won(value: number) {
  const rounded = Math.max(Math.round(value), 0);
  const eok = Math.floor(rounded / 10000);
  const man = rounded % 10000;
  if (eok === 0) return `${number.format(man)}만원`;
  if (man === 0) return `${number.format(eok)}억원`;
  return `${number.format(eok)}억 ${number.format(man)}만원`;
}

function monthlyPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0) return 0;
  const months = Math.max(years * 12, 1);
  const rate = Math.max(annualRate, 0) / 100 / 12;
  if (rate === 0) return principal / months;
  return principal * rate * ((1 + rate) ** months) / (((1 + rate) ** months) - 1);
}

function standardAcquisitionTaxRate(price: number) {
  const priceEok = price / 10000;
  if (priceEok <= 6) return 1;
  if (priceEok <= 9) return (priceEok * 2 / 3) - 3;
  return 3;
}

function acquisitionTaxRate(price: number, homesAfterPurchase: number, adjustedArea: boolean) {
  if (adjustedArea && homesAfterPurchase === 2) return 8;
  if (adjustedArea && homesAfterPurchase >= 3) return 12;
  if (!adjustedArea && homesAfterPurchase === 3) return 8;
  if (!adjustedArea && homesAfterPurchase >= 4) return 12;
  return standardAcquisitionTaxRate(price);
}

function brokerageFee(price: number) {
  if (price < 5000) return Math.min(price * 0.006, 25);
  if (price < 20000) return Math.min(price * 0.005, 80);
  if (price < 90000) return price * 0.004;
  if (price < 120000) return price * 0.005;
  if (price < 150000) return price * 0.006;
  return price * 0.007;
}

function mortgageCap(price: number, capitalOrRegulated: boolean) {
  if (!capitalOrRegulated) return Number.POSITIVE_INFINITY;
  if (price <= 150000) return 60000;
  if (price <= 250000) return 40000;
  return 20000;
}

export function PropertyPurchaseSimulationTool() {
  const [annualIncome, setAnnualIncome] = useState(9000);
  const [currentHomes, setCurrentHomes] = useState<HouseCount>(0);
  const [adjustedArea, setAdjustedArea] = useState(false);
  const [capitalArea, setCapitalArea] = useState(true);
  const [sellExisting, setSellExisting] = useState(false);
  const [priceEok, setPriceEok] = useState(10);
  const [cash, setCash] = useState(35000);
  const [existingMonthlyDebt, setExistingMonthlyDebt] = useState(0);
  const [rate, setRate] = useState(4.2);
  const [years, setYears] = useState(30);

  const result = useMemo(() => {
    const price = Math.max(priceEok, 0) * 10000;
    const homesAfterPurchase = currentHomes + 1;
    const taxRate = acquisitionTaxRate(price, homesAfterPurchase, adjustedArea);
    const acquisitionTax = price * taxRate / 100;
    const brokerFee = brokerageFee(price);
    const registrationCost = price * 0.002;
    const purchaseCosts = acquisitionTax + brokerFee + registrationCost;
    const totalRequired = price + purchaseCosts;
    const neededLoan = Math.max(totalRequired - cash, 0);

    const capitalOrRegulated = capitalArea || adjustedArea;
    const conditionalOneHome = currentHomes === 1 && sellExisting;
    const extraPurchaseBlocked = currentHomes >= 1 && capitalOrRegulated && !conditionalOneHome;
    const ltvRate = extraPurchaseBlocked ? 0 : adjustedArea ? 40 : currentHomes === 0 || conditionalOneHome ? 70 : 60;
    const policyCap = mortgageCap(price, capitalOrRegulated);
    const ltvLimit = Math.min(price * ltvRate / 100, policyCap);

    const dtiRate = adjustedArea ? 40 : 60;
    const monthlyBudget = Math.max((annualIncome * dtiRate / 100 / 12) - existingMonthlyDebt, 0);
    const paymentPerMan = monthlyPayment(1, rate, years);
    const dtiLimit = paymentPerMan > 0 ? monthlyBudget / paymentPerMan : 0;
    const actualLoan = Math.max(Math.min(neededLoan, ltvLimit, dtiLimit), 0);
    const monthlyRepayment = monthlyPayment(actualLoan, rate, years);
    const cashGap = Math.max(totalRequired - cash - actualLoan, 0);
    const status = extraPurchaseBlocked ? "추가주택 대출 제한 확인" : cashGap === 0 ? "현재 입력으로 자금 충족" : cashGap <= price * 0.05 ? "현금 보완 필요" : "매수 구조 재검토 필요";

    return { acquisitionTax, actualLoan, brokerFee, cashGap, dtiLimit, dtiRate, extraPurchaseBlocked, homesAfterPurchase, ltvLimit, ltvRate, monthlyRepayment, neededLoan, policyCap, purchaseCosts, registrationCost, status, taxRate, totalRequired };
  }, [adjustedArea, annualIncome, capitalArea, cash, currentHomes, existingMonthlyDebt, priceEok, rate, sellExisting, years]);

  return (
    <main className="tool-shell">
      <a className="back" href="/">← AI 투자 도구 MASTER</a>
      <header>
        <span>PROPERTY PURCHASE SIMULATION</span>
        <h1>부동산 구매 종합 시뮬레이션</h1>
        <p>주택 수와 지역 규제를 반영해 세금·부대비용·대출 가능액을 한 번에 확인합니다.</p>
      </header>
      <div className="privacy">🔒 입력값은 이 브라우저 화면에서만 계산되며 서버에 저장되지 않습니다.</div>

      <section className="workspace">
        <form className="panel" onSubmit={(event) => event.preventDefault()}>
          <section className="form-section">
            <div className="section-title"><b>01</b><div><h2>소득·보유주택</h2><p>대출 및 취득세 판단의 기준입니다.</p></div></div>
            <label htmlFor="income">연소득 <small>만원</small><input id="income" type="number" min="0" step="100" value={annualIncome} onChange={(event) => setAnnualIncome(Number(event.target.value))} /></label>
            <label htmlFor="homes">현재 주택 수 <small>이번 주택 취득 전</small>
              <select id="homes" value={currentHomes} onChange={(event) => setCurrentHomes(Number(event.target.value) as HouseCount)}>
                <option value={0}>무주택</option><option value={1}>1주택</option><option value={2}>2주택</option><option value={3}>3주택 이상</option>
              </select>
            </label>
            {currentHomes === 1 && <label className="check"><input type="checkbox" checked={sellExisting} onChange={(event) => setSellExisting(event.target.checked)} /><span><b>기존 주택 6개월 이내 처분 예정</b><small>체크하면 처분조건부 1주택자로 LTV를 계산합니다.</small></span></label>}
            <div className="checks">
              <label className="check"><input type="checkbox" checked={adjustedArea} onChange={(event) => setAdjustedArea(event.target.checked)} /><span><b>조정대상지역 여부</b><small>취득세 중과와 규제지역 LTV·DTI 반영</small></span></label>
              <label className="check"><input type="checkbox" checked={capitalArea} onChange={(event) => setCapitalArea(event.target.checked)} /><span><b>수도권 주택 여부</b><small>추가주택 대출 및 주담대 총액한도 반영</small></span></label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-title"><b>02</b><div><h2>구매·대출 조건</h2><p>집값은 억원, 나머지 금액은 만원입니다.</p></div></div>
            <div className="two">
              <label htmlFor="price">집값 <small>억원</small><input id="price" type="number" min="0" step="0.1" value={priceEok} onChange={(event) => setPriceEok(Number(event.target.value))} /></label>
              <label htmlFor="cash">보유 현금 <small>만원</small><input id="cash" type="number" min="0" step="1000" value={cash} onChange={(event) => setCash(Number(event.target.value))} /></label>
            </div>
            <label htmlFor="debt">기존 대출 월 상환금 <small>만원</small><input id="debt" type="number" min="0" step="10" value={existingMonthlyDebt} onChange={(event) => setExistingMonthlyDebt(Number(event.target.value))} /></label>
            <div className="two">
              <label htmlFor="rate">신규 대출 금리 <small>%</small><input id="rate" type="number" min="0" max="20" step="0.1" value={rate} onChange={(event) => setRate(Number(event.target.value))} /></label>
              <label htmlFor="years">상환기간 <small>년</small><input id="years" type="number" min="1" max="50" value={years} onChange={(event) => setYears(Number(event.target.value))} /></label>
            </div>
          </section>
        </form>

        <section className="result" aria-live="polite">
          <span className="eyebrow">시뮬레이션 결과</span>
          <h2>{result.status}</h2>
          <div className="hero-number"><small>추가로 필요한 현금</small><strong>{won(result.cashGap)}</strong><p>집값과 취득 부대비용을 합산한 뒤 실제 대출 가능액을 차감했습니다.</p></div>
          <div className="summary-grid">
            <article><small>취득 후 주택 수</small><b>{result.homesAfterPurchase >= 4 ? "4주택 이상" : `${result.homesAfterPurchase}주택`}</b></article>
            <article><small>총 필요 자금</small><b>{won(result.totalRequired)}</b></article>
            <article><small>실제 대출 가능액</small><b>{won(result.actualLoan)}</b></article>
            <article><small>예상 월 상환금</small><b>{won(result.monthlyRepayment)}</b></article>
          </div>

          <section className="breakdown"><h3>세금·거래비용</h3><dl>
            <div><dt>취득세 <em>{result.taxRate.toFixed(2)}%</em></dt><dd>{won(result.acquisitionTax)}</dd></div>
            <div><dt>중개수수료 <em>법정 상한 기준</em></dt><dd>{won(result.brokerFee)}</dd></div>
            <div><dt>등기·채권·법무비용 <em>0.2% 추정</em></dt><dd>{won(result.registrationCost)}</dd></div>
            <div className="total"><dt>부대비용 합계</dt><dd>{won(result.purchaseCosts)}</dd></div>
          </dl></section>

          <section className="breakdown"><h3>대출 한도</h3><dl>
            <div><dt>LTV 한도 <em>{result.ltvRate}% 적용</em></dt><dd>{won(result.ltvLimit)}</dd></div>
            <div><dt>DTI 한도 <em>{result.dtiRate}% 단순 적용</em></dt><dd>{won(result.dtiLimit)}</dd></div>
            <div><dt>필요 대출액</dt><dd>{won(result.neededLoan)}</dd></div>
            <div className="total"><dt>실제 대출 가능액</dt><dd>{won(result.actualLoan)}</dd></div>
          </dl>
            {Number.isFinite(result.policyCap) && <p className="policy">수도권·규제지역 주담대 총액한도 {won(result.policyCap)}도 함께 적용했습니다.</p>}
            {result.extraPurchaseBlocked && <p className="warning">현재 보유주택 조건에서는 수도권·규제지역 추가주택 구입목적 주담대를 LTV 0%로 계산했습니다.</p>}
          </section>

          <p className="note">2026년 8월 기준 개인의 일반 주택 매매를 단순화한 참고 계산입니다. 일시적 2주택, 생애최초·정책대출, 주택 수 제외 특례, 지방교육세·농어촌특별세, 금융기관별 DSR 심사는 별도 확인이 필요합니다.</p>
          <nav className="sources" aria-label="계산 기준 출처"><a href="https://www.law.go.kr/법령/지방세법/제11조" target="_blank" rel="noreferrer">지방세법</a><a href="https://www.fsc.go.kr/no010101/87222" target="_blank" rel="noreferrer">금융위원회 대출기준</a><a href="https://irts.molit.go.kr/com/cmn/popup/fee/rtecsFeeRtoPopup.do" target="_blank" rel="noreferrer">국토부 중개보수</a></nav>
        </section>
      </section>

      <style jsx>{`
        *{box-sizing:border-box}.tool-shell{min-height:100vh;padding:34px max(20px,calc((100vw - 1160px)/2)) 70px;background:#f3f6fa;color:#152237;font-family:Pretendard,Arial,sans-serif}.back{display:inline-block;margin-bottom:30px;color:#315f9f;text-decoration:none;font-weight:800}.tool-shell header span,.eyebrow{color:#315f9f;font-size:11px;font-weight:900;letter-spacing:.12em}.tool-shell header h1{margin:8px 0;font-size:clamp(36px,5vw,62px);letter-spacing:-.065em}.tool-shell header p{margin:0;color:#718096}.privacy{margin:24px 0;padding:12px 15px;border:1px solid #cedcf2;border-radius:12px;background:#e9f0fb;color:#416184;font-size:13px}.workspace{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:18px;align-items:start}.panel,.result{border:1px solid #dce3ed;border-radius:24px;background:#fff;box-shadow:0 12px 35px rgba(21,34,55,.05)}.panel{padding:26px}.result{padding:28px;position:sticky;top:16px}.form-section+.form-section{margin-top:28px;padding-top:27px;border-top:1px solid #e7ecf3}.section-title{display:flex;gap:12px;align-items:flex-start;margin-bottom:18px}.section-title>b{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#315f9f;color:#fff;font-size:12px}.section-title h2{margin:0;font-size:21px}.section-title p{margin:4px 0 0;color:#8491a3;font-size:12px}.panel label{display:grid;gap:7px;margin-top:14px;color:#536175;font-size:13px;font-weight:800}.panel label>small{color:#94a0b0;font-weight:600}.panel input:not([type=checkbox]),.panel select{width:100%;padding:13px;border:1px solid #d7e0ec;border-radius:11px;background:#fff;color:#152237;font:inherit}.panel input:focus,.panel select:focus{outline:3px solid #dbe8fb;border-color:#6f99cf}.two,.checks{display:grid;grid-template-columns:1fr 1fr;gap:10px}.check{display:flex!important;align-items:flex-start;gap:10px;padding:13px;border:1px solid #dce3ed;border-radius:13px;background:#f7f9fc;cursor:pointer}.check input{width:18px;height:18px;margin-top:2px;accent-color:#315f9f}.check span{display:grid;gap:3px}.check span small{color:#8491a3;font-size:11px;line-height:1.45}.result>h2{margin:7px 0 18px;font-size:30px;color:#315f9f}.hero-number{padding:20px;border-radius:17px;background:linear-gradient(135deg,#dfeafb,#eef4fd)}.hero-number small{color:#587398}.hero-number strong{display:block;margin:7px 0;font-size:34px;letter-spacing:-.04em}.hero-number p,.note,.policy,.warning{margin:0;color:#718096;font-size:12px;line-height:1.6}.summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.summary-grid article{display:grid;gap:5px;padding:14px;border:1px solid #e3e9f1;border-radius:13px}.summary-grid small{color:#8491a3}.summary-grid b{font-size:17px}.breakdown{margin-top:18px}.breakdown h3{margin:0 0 7px;font-size:16px}.breakdown dl{margin:0}.breakdown dl div{display:flex;justify-content:space-between;gap:14px;padding:10px 2px;border-bottom:1px solid #e9edf3}.breakdown dt{color:#65748a}.breakdown dt em{margin-left:4px;color:#94a0b0;font-size:10px;font-style:normal}.breakdown dd{margin:0;text-align:right;font-weight:900}.breakdown .total{padding:13px 12px;border:0;border-radius:11px;background:#edf3fc}.policy,.warning{margin-top:10px;padding:10px 12px;border-radius:10px;background:#f2f6fb}.warning{background:#fff1e8;color:#a45625}.note{margin-top:18px;padding-top:16px;border-top:1px solid #e5eaf1}.sources{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.sources a{padding:7px 10px;border-radius:999px;background:#eef3fa;color:#315f9f;font-size:11px;font-weight:800;text-decoration:none}@media(max-width:860px){.workspace{grid-template-columns:1fr}.result{position:static}}@media(max-width:560px){.tool-shell{padding-top:22px}.panel,.result{padding:20px}.two,.checks,.summary-grid{grid-template-columns:1fr}.tool-shell header h1{font-size:38px}.hero-number strong{font-size:29px}}
      `}</style>
    </main>
  );
}
