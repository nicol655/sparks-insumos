import { beforeEach, describe, expect, it } from "vitest";

import { SESSION_STORAGE_KEY, useSessionStore } from "@/lib/auth/session-store";

describe("session store", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    useSessionStore.setState({
      accessToken: null,
      mustChangePassword: false,
      hydrated: false,
    });
  });

  it("starts without a token", () => {
    expect(useSessionStore.getState().accessToken).toBeNull();
  });

  it("persists the bearer in sessionStorage and not in localStorage", () => {
    useSessionStore.getState().setSession("tok", true);

    expect(useSessionStore.getState().accessToken).toBe("tok");
    expect(useSessionStore.getState().mustChangePassword).toBe(true);

    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    expect(raw).toContain("tok");
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("clears the token", () => {
    useSessionStore.getState().setSession("tok", false);
    useSessionStore.getState().clearSession();

    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toContain("tok");
  });
});
