import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 투자 거울",
  description: "투자 판단을 한 번 더 비추고 점검하는 개인 투자 보조 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
