import type { Metadata } from "next";

export const metadata: Metadata = { title: "부동산 구매 종합 시뮬레이션", description: "현금·대출·부대비용·월 상환액을 한 번에 계산" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body style={{ margin: 0 }}>{children}</body></html>;
}
