import { forwardUserPatch } from "@/lib/users/proxy";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  return forwardUserPatch(request, id);
}
