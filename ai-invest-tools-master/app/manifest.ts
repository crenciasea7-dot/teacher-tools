import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI 투자 도구 MASTER",
    short_name: "AI 투자도구",
    description: "자산 관리부터 투자 판단까지 한 곳에서 실행하는 개인 AI 도구 모음",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f6f3",
    theme_color: "#13292a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
