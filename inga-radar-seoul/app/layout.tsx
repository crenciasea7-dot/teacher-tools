import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "인가 레이더 서울", description: "서울 재개발·재건축 인허가 공식 신호 추적 도구" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
