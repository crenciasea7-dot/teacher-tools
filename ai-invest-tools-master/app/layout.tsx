import type { Metadata, Viewport } from "next"; import "./globals.css";
import PlatformNav from "./components/platform-nav";
import FloatingActions from "./components/floating-actions";
export const metadata: Metadata = {
  title: "AI 투자 도구 MASTER",
  description: "투자 판단을 위한 개인 AI 도구 모음",
  applicationName: "AI 투자 도구 MASTER",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "AI 투자도구", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#13292a" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body><PlatformNav /><aside className="global-privacy"><b>🔒 프라이버시 안내</b><span>별도 서버나 데이터베이스에 개인정보를 저장하지 않습니다. 각 도구의 저장 안내를 확인하세요.</span></aside>{children}<FloatingActions /></body></html>}
