import { beforeEach, describe, expect, it, vi } from "vitest";

import { endSession, redirectAfterSessionEnd } from "@/lib/auth/end-session";
import { useSessionStore } from "@/lib/auth/session-store";

describe("endSession", () => {
  beforeEach(() => {
    redirectAfterSessionEnd(null);
    useSessionStore.setState({ accessToken: "tok", mustChangePassword: true, hydrated: true });
  });

  it("clears the token and opens login", () => {
    const replace = vi.fn();
    endSession(replace);

    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(useSessionStore.getState().mustChangePassword).toBe(false);
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("sends the guard's unauthorized bounce to login only after the session ended", () => {
    expect(redirectAfterSessionEnd("/unauthorized")).toBe("/unauthorized");

    endSession(vi.fn());

    expect(redirectAfterSessionEnd("/unauthorized")).toBe("/login");
    expect(redirectAfterSessionEnd(null)).toBeNull();
    expect(redirectAfterSessionEnd("/unauthorized")).toBe("/unauthorized");
  });
});
