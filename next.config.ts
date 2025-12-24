import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d36mxiodymuqjm.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "files.peakd.com",
      },
      {
        protocol: "https",
        hostname: "runi.splinterlands.com",
      },
      {
        protocol: "https",
        hostname: "splinterlands.com",
      },
      {
        protocol: "https",
        hostname: "images.hive.blog",
      },
    ],
  },
};

export default nextConfig;
