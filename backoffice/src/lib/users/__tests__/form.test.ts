import { describe, expect, it } from "vitest";

import { createBody, missingField, patchBody, type UserDraft } from "@/lib/users/form";

const draft: UserDraft = {
  firstName: " Ana ",
  lastName: "Pérez",
  email: "ana@example.com",
  phone: "+5491168692694",
  password: "",
};

describe("user form", () => {
  it("asks for each empty field and for a password on create", () => {
    expect(missingField({ ...draft, firstName: " " }, "edit")).toBe("Completá el nombre.");
    expect(missingField({ ...draft, lastName: "" }, "edit")).toBe("Completá el apellido.");
    expect(missingField({ ...draft, email: "" }, "edit")).toBe("Completá el email.");
    expect(missingField({ ...draft, phone: "" }, "edit")).toBe("Completá el teléfono.");
    expect(missingField(draft, "create")).toBe("Completá la contraseña.");
    expect(missingField(draft, "edit")).toBeNull();
  });

  it("omits an empty password and never sends tier or notes", () => {
    expect(createBody({ ...draft, password: "Sparks1!" })).toEqual({
      first_name: "Ana",
      last_name: "Pérez",
      email: "ana@example.com",
      phone: "+5491168692694",
      password: "Sparks1!",
    });
    const patched = patchBody(draft, false);
    expect(patched).toEqual({
      first_name: "Ana",
      last_name: "Pérez",
      email: "ana@example.com",
      phone: "+5491168692694",
      active: false,
    });
    expect(patched).not.toHaveProperty("password");
    expect(patched).not.toHaveProperty("tier");
    expect(patched).not.toHaveProperty("notes");
  });
});
