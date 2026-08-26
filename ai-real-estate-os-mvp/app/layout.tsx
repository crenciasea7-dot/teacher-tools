import type { Metadata } from "next";
import "./globals.css";
import "./workspace-extras.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "집값연구소 | AI 부동산 투자 OS",
  description: "호가·실거래·계산·추정을 분리해 검토하는 로컬 우선 부동산 투자 도구",
  openGraph: {
    title: "집값연구소 | AI 부동산 투자 OS",
    description: "사실·계산·추정을 나눠 보는 AI 부동산 투자 OS",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "집값연구소 AI 부동산 투자 OS" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "집값연구소 | AI 부동산 투자 OS",
    description: "사실·계산·추정을 나눠 보는 AI 부동산 투자 OS",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
