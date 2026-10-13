export type RoleDraft = {
  slug: string;
  name: string;
  permissionIds: string[];
};

export type RoleCreateBody = {
  slug: string;
  name: string;
  permission_ids: string[];
};

export type RolePatchBody = {
  slug?: string;
  name?: string;
};

export type RolePermissionsBody = {
  permission_ids: string[];
};

export function missingRoleField(draft: RoleDraft): string | null {
  if (!draft.name.trim()) return "Completá el nombre del rol.";
  if (!draft.slug.trim()) return "Completá el slug del rol.";
  return null;
}

export function createRoleBody(draft: RoleDraft): RoleCreateBody {
  return {
    slug: draft.slug.trim().toLowerCase(),
    name: draft.name.trim(),
    permission_ids: [...draft.permissionIds],
  };
}

export function patchRoleBody(
  draft: RoleDraft,
  original: { slug: string; name: string },
): RolePatchBody | null {
  const body: RolePatchBody = {};
  const slug = draft.slug.trim().toLowerCase();
  const name = draft.name.trim();
  if (slug !== original.slug) body.slug = slug;
  if (name !== original.name) body.name = name;
  return Object.keys(body).length > 0 ? body : null;
}

export function permissionsBody(draft: RoleDraft): RolePermissionsBody {
  return { permission_ids: [...draft.permissionIds] };
}

export function duplicateDraft(source: {
  slug: string;
  name: string;
  permission_ids: string[];
}): RoleDraft {
  return {
    slug: `${source.slug}-copia`.slice(0, 64),
    name: `${source.name} (copia)`.slice(0, 120),
    permissionIds: [...source.permission_ids],
  };
}
