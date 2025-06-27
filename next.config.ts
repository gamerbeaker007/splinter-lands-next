import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
