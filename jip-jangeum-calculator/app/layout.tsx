import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "집 잔금대출 계산기",
  description: "분양가와 소득을 바탕으로 예상 잔금대출 한도를 확인합니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
