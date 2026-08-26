import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "moyo 자산 대시보드",
  description: "부동산·금융자산·현금을 한눈에 관리하는 개인 자산 대시보드",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
