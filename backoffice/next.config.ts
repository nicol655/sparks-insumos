import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // The dev server is reached as http://backoffice:3000 from other containers.
  allowedDevOrigins: ["backoffice", "localhost", "127.0.0.1"],
  // Turbopack ignores WATCHPACK_POLLING. On a Windows bind mount the dev
  // server otherwise keeps the previous client bundle, and a strict schema
  // rejects API fields added after that bundle was compiled.
  watchOptions: {
    pollIntervalMs: 1000,
  },
};

export default nextConfig;
