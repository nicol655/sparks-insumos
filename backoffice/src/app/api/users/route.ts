import { forwardUsers } from "@/lib/users/proxy";

export function GET(request: Request) {
  return forwardUsers(request);
}

export function POST(request: Request) {
  return forwardUsers(request);
}
