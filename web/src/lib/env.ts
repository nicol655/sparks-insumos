import { z } from "zod";

/**
 * Runtime configuration, validated once at module load.
 *
 * NEXT_PUBLIC_* variables must be referenced as literal property accesses so
 * Next can inline them into the client bundle — hence the explicit object
 * below instead of handing over `process.env`.
 */
const envSchema = z
  .object({
    /** `mock` reads src/fixtures; `http` talks to the api/ service. */
    API_MODE: z.enum(["mock", "http"]).default("mock"),
    // z.url() alone would accept "api:8000": any scheme makes a valid URI.
    API_BASE_URL: z
      .url()
      .refine((value) => /^https?:\/\//.test(value), { message: "must be an http(s) URL" })
      .optional(),
    /**
     * Business WhatsApp number from §06, digits only. Public information, not
     * a secret: it is printed on the site. The default keeps builds working
     * without an .env while still rejecting a malformed override.
     */
    NEXT_PUBLIC_WHATSAPP_NUMBER: z
      .string()
      .regex(/^\d{8,15}$/, "must be 8 to 15 digits, no symbols or spaces")
      .default("5491168692694"),
    /**
     * §03 · the announcement bar is "desactivable por configuración". An env
     * flag is that knob until the backend owns promotions (open question 3 of
     * the spec); the component reads a boolean either way, so swapping the
     * source later touches one line of the layout.
     */
    NEXT_PUBLIC_ANNOUNCEMENT: z
      .enum(["on", "off"])
      .default("on")
      .transform((value) => value === "on"),
    /**
     * Public origin for metadataBase / Open Graph. Optional so local Docker
     * builds still work; production sets the real shop URL.
     */
    NEXT_PUBLIC_SITE_URL: z
      .url()
      .refine((value) => /^https?:\/\//.test(value), { message: "must be an http(s) URL" })
      .optional(),
  })
  .refine((value) => value.API_MODE !== "http" || Boolean(value.API_BASE_URL), {
    message: "API_BASE_URL is required when API_MODE is http",
    path: ["API_BASE_URL"],
  });

export type Env = z.infer<typeof envSchema>;

/** Exposed for tests; the application uses the `env` singleton below. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse({
    API_MODE: source.API_MODE,
    API_BASE_URL: source.API_BASE_URL,
    NEXT_PUBLIC_WHATSAPP_NUMBER: source.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_ANNOUNCEMENT: source.NEXT_PUBLIC_ANNOUNCEMENT,
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
  });

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  return result.data;
}

export const env = parseEnv({
  API_MODE: process.env.API_MODE,
  API_BASE_URL: process.env.API_BASE_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_ANNOUNCEMENT: process.env.NEXT_PUBLIC_ANNOUNCEMENT,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
