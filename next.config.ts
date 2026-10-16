import type { NextConfig } from "next";
import { name, version } from "./package.json";

// Unique per build (Docker build arg, CI passes the git SHA). Enables Next.js version-skew
// protection (stale tabs hard-reload on navigation) and the "new version available" snackbar.
// Unset in dev / plain local builds → both are off.
const deploymentId = process.env.DEPLOYMENT_ID || undefined;

const isDev = process.env.NODE_ENV === "development";

// Per-player SPL reads go browser → SPL (src/lib/frontend/spl-browser-api.ts),
// to the same hosts as splApiConfig (test stack when NEXT_PUBLIC_SPL_DEV_API=true).
const splConnectSrc =
  process.env.NEXT_PUBLIC_SPL_DEV_API === "true"
    ? "https://api.mavs-sl.com https://vapi.mavs-sl.com"
    : "https://api.splinterlands.com https://vapi.splinterlands.com";

// Support page reads (lib/frontend/support-data.ts): Hive nodes for HIVE/HBD
// balances and the validator API for votes.
const supportConnectSrc = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://rpc.mahdiyari.info",
  "https://api.deathwing.me",
  "https://validator.spl-stats.com",
].join(" ");

// Image hosts: keep in sync with images.remotePatterns and the raw <img> URLs
// (lib/shared/statics_icon_urls.ts, lib/utils/deedUtil.ts).
const imageHosts = [
  "https://d36mxiodymuqjm.cloudfront.net",
  "https://files.peakd.com",
  "https://runi.splinterlands.com",
  "https://splinterlands.com",
  "https://next.splinterlands.com",
  "https://images.hive.blog",
].join(" ");

// The SPL JWT cookie is JS-readable (lib/frontend/splSession.ts),
// so restrict where scripts load from and where data may be sent.
// 'unsafe-inline' scripts: Next's bootstrap and the ThemeSetup FOUC script.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${imageHosts}`,
  `connect-src 'self' ${splConnectSrc} ${supportConnectSrc}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  deploymentId,
  env: {
    NEXT_PUBLIC_APP_NAME: name,
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_DEPLOYMENT_ID: deploymentId ?? "",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
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
