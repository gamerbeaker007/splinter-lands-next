import type { NextConfig } from "next";
import { name, version } from "./package.json";

// Unique per build (Docker build arg, CI passes the git SHA). Enables Next.js version-skew
// protection (stale tabs hard-reload on navigation) and the "new version available" snackbar.
// Unset in dev / plain local builds → both are off.
const deploymentId = process.env.DEPLOYMENT_ID || undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  deploymentId,
  env: {
    NEXT_PUBLIC_APP_NAME: name,
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_DEPLOYMENT_ID: deploymentId ?? "",
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
