export type UserDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type UserCreateBody = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
};

export type UserPatchBody = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  active: boolean;
  password?: string;
};

const GAPS = [
  ["firstName", "Completá el nombre."],
  ["lastName", "Completá el apellido."],
  ["email", "Completá el email."],
  ["phone", "Completá el teléfono."],
] as const;

export function missingField(draft: UserDraft, mode: "create" | "edit"): string | null {
  for (const [key, message] of GAPS) {
    if (!draft[key].trim()) return message;
  }
  if (mode === "create" && !draft.password.trim()) return "Completá la contraseña.";
  return null;
}

export function createBody(draft: UserDraft): UserCreateBody {
  return {
    first_name: draft.firstName.trim(),
    last_name: draft.lastName.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    password: draft.password,
  };
}

export function patchBody(draft: UserDraft, active: boolean): UserPatchBody {
  const body: UserPatchBody = {
    first_name: draft.firstName.trim(),
    last_name: draft.lastName.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    active,
  };
  if (draft.password.trim()) body.password = draft.password;
  return body;
}
