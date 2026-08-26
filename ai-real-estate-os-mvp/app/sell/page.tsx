import { ConversationWorkspace } from "../components/conversation-workspace";
import { SiteHeader } from "../components/site-header";
export default function SellPage(){return <main><SiteHeader/><section className="page-intro sell"><span className="eyebrow">APARTMENT SELL</span><h1>아파트 매도 작업실</h1><p>우리 집과 경쟁 매물을 한 문단으로 설명하면 호가 경쟁력과 가격 시나리오를 정리합니다.</p></section><ConversationWorkspace initialIntent="sell" kind="sell"/></main>}
