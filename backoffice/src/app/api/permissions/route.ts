import { forwardPermissions } from "@/lib/roles/proxy";

export function GET(request: Request) {
  return forwardPermissions(request);
}
