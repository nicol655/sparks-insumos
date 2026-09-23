import { describe, expect, it } from "vitest";

import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("defaults to the mock data source", () => {
    expect(parseEnv({}).API_MODE).toBe("mock");
  });

  it("defaults the WhatsApp number to the one in the design specification", () => {
    expect(parseEnv({}).NEXT_PUBLIC_WHATSAPP_NUMBER).toBe("5491168692694");
  });

  it("accepts a full http configuration", () => {
    const env = parseEnv({ API_MODE: "http", API_BASE_URL: "http://api:8000" });

    expect(env.API_MODE).toBe("http");
    expect(env.API_BASE_URL).toBe("http://api:8000");
  });

  it("refuses http mode without a base URL", () => {
    expect(() => parseEnv({ API_MODE: "http" })).toThrow(/API_BASE_URL is required/);
  });

  it("refuses an unknown data source", () => {
    expect(() => parseEnv({ API_MODE: "graphql" })).toThrow(/API_MODE/);
  });

  it("refuses a malformed base URL", () => {
    expect(() => parseEnv({ API_MODE: "http", API_BASE_URL: "api:8000" })).toThrow(/API_BASE_URL/);
  });

  it.each(["+54 9 11 6869 2694", "549116869269412345678", "abc"])(
    "refuses the WhatsApp number %s",
    (number) => {
      expect(() => parseEnv({ NEXT_PUBLIC_WHATSAPP_NUMBER: number })).toThrow(/digits/);
    },
  );

  it("defaults the announcement bar to on", () => {
    expect(parseEnv({}).NEXT_PUBLIC_ANNOUNCEMENT).toBe(true);
  });

  it("can turn the announcement bar off", () => {
    expect(parseEnv({ NEXT_PUBLIC_ANNOUNCEMENT: "off" }).NEXT_PUBLIC_ANNOUNCEMENT).toBe(false);
  });

  it("refuses an unknown announcement setting", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_ANNOUNCEMENT: "maybe" })).toThrow(
      /NEXT_PUBLIC_ANNOUNCEMENT/,
    );
  });

  it("accepts an optional public site URL", () => {
    expect(parseEnv({}).NEXT_PUBLIC_SITE_URL).toBeUndefined();
    expect(parseEnv({ NEXT_PUBLIC_SITE_URL: "https://example.com" }).NEXT_PUBLIC_SITE_URL).toBe(
      "https://example.com",
    );
  });
});
