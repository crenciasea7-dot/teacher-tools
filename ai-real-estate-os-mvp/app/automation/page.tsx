import { ConversationWorkspace } from "../components/conversation-workspace";
import { SiteHeader } from "../components/site-header";
export default function AutomationPage(){return <main><SiteHeader/><section className="page-intro automation"><span className="eyebrow">AUTOMATION MENU</span><h1>부동산 업무 자동화</h1><p>통화 메모, 임장 보고, 매물 변화 비교처럼 반복되는 일을 설명하세요. 로컬 수동 실행과 외부 연결 필요 작업을 구분합니다.</p></section><ConversationWorkspace initialIntent="automation" kind="automation"/></main>}
