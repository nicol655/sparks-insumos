import { describe, expect, it, vi } from "vitest";

import { env } from "@/lib/env";
import { CATALOG_TOKEN_HEADER } from "@/lib/catalog/token-header";
import { forwardUserPatch, forwardUsers } from "@/lib/users/proxy";

const fetchImpl = vi.fn<typeof fetch>();
const userId = "22222222-2222-4222-8222-222222222222";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("users proxy", () => {
  it("does not call the API without a bearer", async () => {
    fetchImpl.mockReset();
    const response = await forwardUsers(new Request("http://panel.local/api/users"), fetchImpl);

    expect(response.status).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards GET and POST to /users and accepts the spare header", async () => {
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async () => json([]));
    const response = await forwardUsers(
      new Request("http://panel.local/api/users?limit=50", {
        headers: { [CATALOG_TOKEN_HEADER]: "tok" },
      }),
      fetchImpl,
    );

    expect(response.status).toBe(200);
    const getCall = fetchImpl.mock.calls[0];
    expect(getCall?.[0]).toBe(`${env.API_BASE_URL}/users?limit=50`);
    expect(getCall?.[1]?.method).toBe("GET");
    expect(new Headers(getCall?.[1]?.headers).get("Authorization")).toBe("Bearer tok");

    fetchImpl.mockImplementation(async () => json({ id: userId }, 201));
    await forwardUsers(
      new Request("http://panel.local/api/users", {
        method: "POST",
        headers: {
          Authorization: "Bearer tok",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ first_name: "Ana" }),
      }),
      fetchImpl,
    );
    const post = fetchImpl.mock.calls[1];
    expect(post?.[0]).toBe(`${env.API_BASE_URL}/users`);
    expect(post?.[1]?.method).toBe("POST");
  });

  it("patches only a uuid and skips the fetch otherwise", async () => {
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async () => json({ id: userId }));
    const response = await forwardUserPatch(
      new Request("http://panel.local/api/users/x", {
        method: "PATCH",
        headers: { Authorization: "Bearer tok" },
      }),
      userId,
      fetchImpl,
    );

    expect(response.status).toBe(200);
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(`${env.API_BASE_URL}/users/${userId}`);

    fetchImpl.mockClear();
    const missing = await forwardUserPatch(
      new Request("http://panel.local/api/users/nope", {
        method: "PATCH",
        headers: { Authorization: "Bearer tok" },
      }),
      "nope",
      fetchImpl,
    );
    expect(missing.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
