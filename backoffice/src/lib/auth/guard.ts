const PUBLIC_PATHS = new Set(["/login", "/unauthorized"]);

export function decideRedirect(
  pathname: string,
  hasSession: boolean,
  hydrated: boolean,
): "/dashboard" | "/unauthorized" | null {
  if (!hydrated) return null;

  if (PUBLIC_PATHS.has(pathname)) {
    return hasSession ? "/dashboard" : null;
  }

  if (!hasSession) return "/unauthorized";
  if (pathname === "/") return "/dashboard";
  return null;
}
