import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // อนุญาตเฉพาะเว็บของเพื่อน (Netlify) ให้เรียก AI ของเรา
        source: "/api/analyze",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "https://idyllic-basbousa-5ab375.netlify.app" },
          { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

