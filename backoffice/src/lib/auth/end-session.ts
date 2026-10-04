import { useSessionStore } from "@/lib/auth/session-store";

let preferLogin = false;

export function endSession(replace: (path: string) => void): void {
  preferLogin = true;
  useSessionStore.getState().clearSession();
  replace("/login");
}

// Clearing the token while still on /catalogo makes the guard choose
// /unauthorized. That bounce has to become /login, or the operator never
// reaches the form. A visitor who never had a session still goes to
// /unauthorized.
export function redirectAfterSessionEnd(
  next: "/dashboard" | "/unauthorized" | null,
): "/dashboard" | "/unauthorized" | "/login" | null {
  if (!preferLogin) return next;
  if (next === "/unauthorized") return "/login";
  preferLogin = false;
  return next;
}
