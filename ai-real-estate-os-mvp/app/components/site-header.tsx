"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const links = [
  ["/", "홈"],
  ["/buy", "아파트 매수"],
  ["/sell", "아파트 매도"],
  ["/redevelopment", "재개발"],
  ["/automation", "자동화"],
  ["/mirror", "AI 거울"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="집값연구소 홈">
        <span className="brand-mark">집</span>
        <span><strong>집값연구소</strong><small>AI 투자 작업실</small></span>
      </Link>
      <nav aria-label="주요 메뉴">
        {links.map(([href, label]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}
      </nav>
      <Link className="legacy-link" href="/#tools-showroom">내가 만든 도구</Link>
    </header>
  );
}
