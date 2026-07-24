/** @type {import('next').NextConfig} */

// Proxy /api/* to the FastAPI backend so the browser only ever talks to the
// Next.js origin (cookies stay first-party). Set BACKEND_URL in the environment:
//   dev:  http://localhost:5000
//   prod: https://your-fastapi-host.example.com
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
