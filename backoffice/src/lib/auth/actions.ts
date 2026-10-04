import type { LoginClient, LoginClientResult } from "@/lib/auth/client";
import type { LoginRequest } from "@/lib/auth/contract";

export type LoginResult =
  | { ok: true; accessToken: string; mustChangePassword: boolean }
  | { ok: false; code: "invalid_credentials" | "forbidden" | "unavailable" };

export function createLoginAction(client: LoginClient) {
  return async function loginAction(input: LoginRequest): Promise<LoginResult> {
    const result: LoginClientResult = await client.login(input);
    if (!result.ok) {
      return { ok: false, code: result.code };
    }
    return {
      ok: true,
      accessToken: result.accessToken,
      mustChangePassword: result.mustChangePassword,
    };
  };
}
