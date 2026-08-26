import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "AI 투자 프롬프트 스튜디오", description: "매수 과정 전체를 따라가는 AI 투자 가이드" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
