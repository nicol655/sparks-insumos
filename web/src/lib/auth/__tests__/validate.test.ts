import { describe, expect, it } from "vitest";

import { validateProfile, validateRegister, type RegisterInput } from "@/lib/auth/validate";

const VALID: RegisterInput = {
  firstName: "Camila",
  lastName: "Ferrari",
  email: "  Camila@Mail.com  ",
  phone: " +5491168692694 ",
  password: "Sparks1!",
};

describe("validateRegister", () => {
  it("accepts a trimmed name, a lowercased email, the sample phone and Sparks1!", () => {
    expect(validateRegister(VALID)).toBeNull();
  });

  it("returns the first failure in form order", () => {
    expect(validateRegister({ ...VALID, firstName: "   ", phone: "11" })).toBe("first_name");
    expect(validateRegister({ ...VALID, lastName: "" })).toBe("last_name");
    expect(validateRegister({ ...VALID, email: "not-an-email" })).toBe("email");
    expect(validateRegister({ ...VALID, email: "@mail.com" })).toBe("email");
    expect(validateRegister({ ...VALID, phone: "11" })).toBe("phone");
    expect(validateRegister({ ...VALID, password: "admin123456" })).toBe("password");
    expect(validateRegister({ ...VALID, password: "Sparks 1!" })).toBe("password");
    expect(validateRegister({ ...VALID, firstName: "a".repeat(81) })).toBe("first_name");
  });
});

describe("validateProfile", () => {
  it("accepts the four fields when the password is empty", () => {
    expect(validateProfile({ ...VALID, password: "" })).toBeNull();
  });

  it("stops on a non-empty password and does not inspect the other fields", () => {
    expect(
      validateProfile({
        firstName: "",
        lastName: "",
        email: "",
        phone: "11",
        password: "Sparks1!",
      }),
    ).toBe("password_unchanged_here");
  });

  it("still reports the first profile field when the password is empty", () => {
    expect(validateProfile({ ...VALID, password: "", phone: "11", firstName: "" })).toBe(
      "first_name",
    );
    expect(validateProfile({ ...VALID, password: "", phone: "11" })).toBe("phone");
  });
});
