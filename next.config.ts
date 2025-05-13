import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dynamic-survey-builder.netlify.app/",
        port: "",
        pathname: "/**",
      },
    ],
  },
  target: process.env.NEXT_USE_NETLIFY_EDGE
    ? "experimental-serverless-trace"
    : undefined,
};

export default nextConfig;
