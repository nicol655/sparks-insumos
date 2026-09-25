/**
 * Client and server checks for the account forms (spec 008 RF-3 / RF-7).
 *
 * Same rules as the API DTO. Returns the first failing field, in form order,
 * so the page can show one message above the submit button.
 */

export type FieldIssue = "first_name" | "last_name" | "email" | "phone" | "password";

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type ProfileInput = RegisterInput;

export type ProfileIssue = FieldIssue | "password_unchanged_here";

function cleanName(value: string): boolean {
  const cleaned = value.trim();
  return cleaned.length >= 1 && cleaned.length <= 80;
}

function cleanEmail(value: string): boolean {
  const cleaned = value.trim().toLowerCase();
  return cleaned.includes("@") && !cleaned.startsWith("@") && !cleaned.endsWith("@");
}

function cleanPhone(value: string): boolean {
  const cleaned = value.trim();
  return (
    cleaned.length >= 6 &&
    cleaned.length <= 32 &&
    cleaned.startsWith("+") &&
    [...cleaned].some((character) => character >= "0" && character <= "9")
  );
}

function isLetter(character: string): boolean {
  return character.toLowerCase() !== character.toUpperCase();
}

function acceptsPassword(password: string): boolean {
  if ([...password].some((character) => /\s/u.test(character))) return false;
  if (password.length < 8 || password.length > 128) return false;
  const characters = [...password];
  if (!characters.some((character) => isLetter(character) && character === character.toUpperCase())) {
    return false;
  }
  if (!characters.some((character) => isLetter(character) && character === character.toLowerCase())) {
    return false;
  }
  if (!characters.some((character) => character >= "0" && character <= "9")) return false;
  return characters.some((character) => !isLetter(character) && !(character >= "0" && character <= "9"));
}

function firstFieldIssue(input: RegisterInput): FieldIssue | null {
  if (!cleanName(input.firstName)) return "first_name";
  if (!cleanName(input.lastName)) return "last_name";
  if (!cleanEmail(input.email)) return "email";
  if (!cleanPhone(input.phone)) return "phone";
  if (!acceptsPassword(input.password)) return "password";
  return null;
}

export function validateRegister(input: RegisterInput): FieldIssue | null {
  return firstFieldIssue(input);
}

export function validateProfile(input: ProfileInput): ProfileIssue | null {
  if (input.password !== "") return "password_unchanged_here";
  if (!cleanName(input.firstName)) return "first_name";
  if (!cleanName(input.lastName)) return "last_name";
  if (!cleanEmail(input.email)) return "email";
  if (!cleanPhone(input.phone)) return "phone";
  return null;
}
