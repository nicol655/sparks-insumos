import { createNavigation } from "next-intl/navigation";

import { routing } from "@/i18n/routing";

/**
 * Locale-aware replacements for next/link and the navigation hooks. Components
 * import Link from here so the prefix and the translated pathname are applied
 * automatically (AC-8).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
