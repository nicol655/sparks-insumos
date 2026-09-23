import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Locale negotiation: redirects "/" to the visitor's best match and rejects
 * unknown prefixes. Named `proxy` rather than `middleware` — Next 16
 * deprecated the old file convention.
 */
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
