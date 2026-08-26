import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "집중 아파트 리서치",
  description: "한 번에 단지의 가격, 입지, 리스크를 비교하는 아파트 리서치 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
