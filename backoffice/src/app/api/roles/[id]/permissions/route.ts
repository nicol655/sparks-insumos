import { forwardRolePermissions } from "@/lib/roles/proxy";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  return forwardRolePermissions(request, id);
}
