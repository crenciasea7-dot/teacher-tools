import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "RONE | 주간 자본 분석", description: "한 주의 자본 흐름과 투자 판단을 기록하는 대시보드" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
