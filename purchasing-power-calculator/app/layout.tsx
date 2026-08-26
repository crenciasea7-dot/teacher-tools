import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "구매력 계산기", description: "자기자금과 연소득으로 최대 매입 가능 매매가를 계산합니다." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
