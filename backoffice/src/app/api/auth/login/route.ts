import { forwardLogin } from "@/lib/auth/proxy";

export function POST(request: Request) {
  return forwardLogin(request);
}
