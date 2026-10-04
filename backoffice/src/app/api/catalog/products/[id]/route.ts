import { forwardProductPatch } from "@/lib/catalog/proxy";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return forwardProductPatch(request, id);
}
