import type { NextConfig } from "next";
import { name, version } from "./package.json";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  env: {
    NEXT_PUBLIC_APP_NAME: name,
    NEXT_PUBLIC_APP_VERSION: version,
  },
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
