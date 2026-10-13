import { forwardRolesCollection } from "@/lib/roles/proxy";

export function GET(request: Request) {
  return forwardRolesCollection(request);
}

export function POST(request: Request) {
  return forwardRolesCollection(request);
}
