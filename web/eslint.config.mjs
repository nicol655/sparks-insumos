import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // AC-8 · no user-visible text may be hard-coded in a component. Errors,
    // not warnings: a literal that ships is a page that only exists in one
    // language, and it is invisible in review.
    files: ["src/components/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    ignores: ["**/__tests__/**"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          // Only what a person reads: JSX text plus the handful of attributes
          // that reach the screen or the accessibility tree. "jsx-text-only"
          // would skip attributes entirely and let a hard-coded alt through,
          // which AC-20 cares about.
          mode: "jsx-only",
          "jsx-attributes": {
            include: ["alt", "aria-label", "aria-description", "placeholder", "title", "label"],
          },
          message: "Move this text into src/i18n/messages and read it with useTranslations.",
        },
      ],
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated artifacts:
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
