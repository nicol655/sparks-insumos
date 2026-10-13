import { forwardRoleById } from "@/lib/roles/proxy";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  return forwardRoleById(request, id);
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  return forwardRoleById(request, id);
}
