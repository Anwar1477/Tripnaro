import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";
const backend = new URL(BACKEND_URL);

const nextConfig: NextConfig = {
  // Hide the dev-only Next.js badge and "Compiling…" pill; route transitions show the Tripnaro
  // loader (app/**/loading.tsx). Compile and runtime errors are still surfaced in development.
  devIndicators: false,
  // Classic App Router caching (fetch `next.revalidate`) is used instead of Cache Components:
  // most pages are search-driven or session-aware, and public catalog pages revalidate on a timer.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Admins may paste images hosted elsewhere (CDNs, partner sites). HTTPS only.
      { protocol: "https", hostname: "**" },
      {
        protocol: backend.protocol.replace(":", "") as "http" | "https",
        hostname: backend.hostname,
        port: backend.port,
        pathname: "/uploads/**",
      },
    ],
  },
  // The browser talks to the API through the frontend origin, so the HTTP-only session cookie
  // is first-party and works identically in development and production.
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
