import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("defaults to the compose API address", () => {
    expect(parseEnv({}).API_BASE_URL).toBe("http://api:8000");
  });

  it("strips a trailing slash", () => {
    expect(parseEnv({ API_BASE_URL: "http://api:8000/" }).API_BASE_URL).toBe("http://api:8000");
  });

  it("refuses an empty value", () => {
    expect(() => parseEnv({ API_BASE_URL: "" })).toThrow(/API_BASE_URL/);
  });

  it("refuses a URL without a scheme", () => {
    expect(() => parseEnv({ API_BASE_URL: "api:8000" })).toThrow(/API_BASE_URL/);
  });

  it("defaults the storefront link when the public URL is missing or empty", () => {
    expect(parseEnv({}).storeUrl).toBe("http://localhost:3000");
    expect(parseEnv({ NEXT_PUBLIC_STORE_URL: "" }).storeUrl).toBe("http://localhost:3000");
  });

  it("strips a trailing slash from the storefront link", () => {
    expect(parseEnv({ NEXT_PUBLIC_STORE_URL: "http://localhost:3000/" }).storeUrl).toBe(
      "http://localhost:3000",
    );
  });

  it("refuses a storefront URL without a scheme", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_STORE_URL: "localhost:3000" })).toThrow(
      /NEXT_PUBLIC_STORE_URL/,
    );
  });
});
