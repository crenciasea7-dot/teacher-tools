import type { Metadata } from "next";

export const metadata: Metadata = { title: "아파트 매도 분석", description: "호가와 시장 반응을 함께 점검하는 매도 분석 도구" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body style={{ margin: 0 }}>{children}</body></html>;
}
