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
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body><PlatformNav /><aside className="global-privacy"><b>🔒 학생·일반 사용자 프라이버시</b><span>로그인 없이 이용하며, 입력값은 별도 서버나 클라우드에 저장하지 않습니다. 다운로드 파일은 현재 기기에만 저장됩니다.</span></aside>{children}<FloatingActions /></body></html>}
