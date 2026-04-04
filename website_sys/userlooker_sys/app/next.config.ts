import type { NextConfig } from "next";
import { USERLOOKER_BASE_PATH } from "./lib/userlookerBasePath";

const nextConfig: NextConfig = {
  basePath: USERLOOKER_BASE_PATH,
  // Behind Express reverse proxy: avoid redirect loops with trailing slash / proxy URL normalize.
  skipTrailingSlashRedirect: true,
  skipProxyUrlNormalize: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
