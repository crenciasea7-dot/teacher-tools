import { ConversationWorkspace } from "../components/conversation-workspace";
import { SiteHeader } from "../components/site-header";
export default function BuyPage(){return <main><SiteHeader/><section className="page-intro buy"><span className="eyebrow">APARTMENT BUY</span><h1>아파트 매수 작업실</h1><p>예산, 입주시기, 생활 조건 또는 관심 매물 중 편한 이야기부터 시작하세요.</p></section><ConversationWorkspace initialIntent="buy" kind="buy"/></main>}
