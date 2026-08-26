import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "집잔금계산 | 2027년 아파트 잔금대출 계산기",
  description: "금융위원회 2026년 부동산 금융 종합대책 기준으로 LTV, DSR, 주택가격별 한도를 비교합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
