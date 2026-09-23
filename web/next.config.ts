import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Required by the Docker `runner` stage: emits a self-contained server bundle.
  output: "standalone",
  // Playwright talks to the dev server as http://web:3000. Without this,
  // Turbopack refuses the HMR upgrade and the client never hydrates.
  allowedDevOrigins: ["web", "localhost", "127.0.0.1"],
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
