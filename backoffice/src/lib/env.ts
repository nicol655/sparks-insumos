import { z } from "zod";

/**
 * API_BASE_URL stays on the server. NEXT_PUBLIC_STORE_URL is the storefront
 * href the header renders; the browser opens it, the panel does not call it.
 */

const httpUrl = z
  .string()
  .refine((value) => /^https?:\/\//.test(value), { message: "must be an http(s) URL" })
  .pipe(z.url());

export type Env = {
  API_BASE_URL: string;
  storeUrl: string;
};

function parseHttpUrl(value: string, name: string): string {
  const result = httpUrl.safeParse(value.replace(/\/$/, ""));

  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n  ${name}: must be an http(s) URL`);
  }

  return result.data;
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  if (source.API_BASE_URL === "") {
    throw new Error("Invalid environment configuration:\n  API_BASE_URL: must not be empty");
  }

  const storeRaw = source.NEXT_PUBLIC_STORE_URL;
  const storeUrl = storeRaw ? storeRaw : "http://localhost:3000";

  return {
    API_BASE_URL: parseHttpUrl(source.API_BASE_URL ?? "http://api:8000", "API_BASE_URL"),
    storeUrl: parseHttpUrl(storeUrl, "NEXT_PUBLIC_STORE_URL"),
  };
}

export const env = parseEnv({
  API_BASE_URL: process.env.API_BASE_URL,
  NEXT_PUBLIC_STORE_URL: process.env.NEXT_PUBLIC_STORE_URL,
});
