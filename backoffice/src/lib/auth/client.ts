import { tokenResponseSchema, type LoginRequest } from "@/lib/auth/contract";

const TIMEOUT_MS = 10_000;

export type LoginSuccess = {
  ok: true;
  accessToken: string;
  mustChangePassword: boolean;
};

export type LoginFailure = {
  ok: false;
  code: "invalid_credentials" | "forbidden" | "unavailable";
};

export type LoginClientResult = LoginSuccess | LoginFailure;

export type LoginClient = {
  login(input: LoginRequest): Promise<LoginClientResult>;
};

function unavailable(): LoginFailure {
  return { ok: false, code: "unavailable" };
}

/** Browser calls the panel proxy (`/api`); tests may point at a fake origin. */
export const PANEL_LOGIN_PATH = "/api/auth/login";

export function createLoginClient(
  baseUrl: string = "",
  fetchImpl: typeof fetch = fetch,
): LoginClient {
  const root = baseUrl.replace(/\/$/, "");
  const url = root ? `${root}${PANEL_LOGIN_PATH}` : PANEL_LOGIN_PATH;

  return {
    async login(input) {
      const body = {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        location: "backoffice" as const,
      };

      let response: Response;
      try {
        response = await fetchImpl(url, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch {
        return unavailable();
      }

      if (response.status === 401) return { ok: false, code: "invalid_credentials" };
      if (response.status === 403) return { ok: false, code: "forbidden" };

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return unavailable();
      }

      if (!response.ok) return unavailable();

      const parsed = tokenResponseSchema.safeParse(payload);
      if (!parsed.success) return unavailable();

      return {
        ok: true,
        accessToken: parsed.data.access_token,
        mustChangePassword: parsed.data.must_change_password,
      };
    },
  };
}
