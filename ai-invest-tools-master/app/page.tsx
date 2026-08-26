"use client";
import { useState } from "react";
type Tool={icon:string;name:string;description:string;url?:string;group:string;accent:string};
const tools:Tool[]=[
{icon:"◈",name:"moyo 자산 대시보드",description:"부동산·금융자산·현금을 한 화면에서 관리",url:"https://moyo-asset-dashboard.crenciasea7.chatgpt.site/",group:"자산 관리",accent:"orange"},
{icon:"▣",name:"보유세 계산기",description:"재산세·종부세를 기준별로 점검",group:"자산 관리",accent:"orange"},
{icon:"↗",name:"아파트 매도 분석",description:"매도 가격과 보유·매도 선택을 비교",group:"자산 관리",accent:"orange"},
{icon:"⌁",name:"집장금 계산기",description:"입주 잔금과 대출 가능 범위를 계산",url:"https://jip-jangeum-calculator.crenciasea7.chatgpt.site/",group:"매수 판단",accent:"blue"},
{icon:"◉",name:"투자거울",description:"투자 판단의 근거·리스크를 비춰보기",url:"https://ai-investment-mirror.crenciasea7.chatgpt.site/",group:"매수 판단",accent:"blue"},
{icon:"⌕",name:"집중 아파트 리서치",description:"후보 아파트를 비교하고 핵심을 정리",url:"https://jipjung-apartment-research.crenciasea7.chatgpt.site/",group:"매수 판단",accent:"blue"},
{icon:"₩",name:"구매력 계산기",description:"자기자금과 소득으로 매수 가능 금액 확인",url:"https://purchasing-power-calculator.vercel.app/",group:"매수 판단",accent:"blue"},
{icon:"⌖",name:"재개발 매물 분석",description:"정비사업 매물의 단계·권리·리스크 점검",group:"정비사업",accent:"green"},
{icon:"R",name:"inga-radar",description:"서울 재개발·재건축 인허가 신호 추적",url:"https://inga-radar-seoul.vercel.app/",group:"정비사업",accent:"green"},
{icon:"R",name:"rone-weekly",description:"주간 자본 흐름과 다음 투자 우선순위",url:"https://rone-weekly-capital-dashboard.vercel.app/",group:"AI 투자 루틴",accent:"purple"},
{icon:"AI",name:"AI 투자 프롬프트 스튜디오",description:"매수 전부터 계약까지 질문으로 따라가기",url:"https://ai-invest-prompt-studio.vercel.app/",group:"AI 투자 루틴",accent:"purple"},
{icon:"+",name:"알바비 관리",description:"수입·지출·목표를 가볍게 관리",group:"생활 관리",accent:"pink"}];
const groups=["전체",...Array.from(new Set(tools.map(t=>t.group)))];
export default function Page(){const [active,setActive]=useState("전체");const shown=active==="전체"?tools:tools.filter(t=>t.group===active);return <main><div className="beta"><span>PUBLIC BETA</span><b>AI 투자 도구 MASTER</b><p>작동 중인 도구를 계속 보완하고 있습니다.</p></div><header><div className="brand"><i>AI</i><div><b>AI 투자 도구 MASTER</b><small>MY PERSONAL INVESTMENT TOOLKIT</small></div></div><div className="count"><strong>12</strong><span>개의 도구</span></div></header><section className="hero"><p>ONE PLACE, BETTER DECISIONS</p><h1>생각은 여기서,<br/><em>판단은 도구로.</em></h1><span>자산 관리부터 매수·정비사업·AI 투자 루틴까지.<br/>내가 만든 도구를 한 곳에서 바로 실행하세요.</span></section><nav>{groups.map(g=><button onClick={()=>setActive(g)} className={g===active?"on":""} key={g}>{g}</button>)}</nav><section className="tools">{shown.map(t=><a className={`card ${t.accent} ${!t.url?"soon":""}`} href={t.url||"#"} target={t.url?"_blank":undefined} key={t.name} onClick={e=>!t.url&&e.preventDefault()}><i>{t.icon}</i><div><span>{t.group}</span><h2>{t.name}</h2><p>{t.description}</p></div><b>{t.url?"바로가기 ↗":"준비 중"}</b></a>)}</section><footer><b>AI INVESTMENT MASTER</b><span>도구는 늘어나고, 판단은 더 선명해집니다.</span></footer></main>}
