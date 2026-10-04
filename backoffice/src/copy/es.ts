/**
 * Visible copy for the backoffice. One language, on purpose (spec 010).
 */

export const copy = {
  brandKicker: "— Sparks · Backoffice",
  wordmark: "Sparks",
  wordmarkSub: "Parfums",
  lines: [
    { index: "01", title: "Perfumería", detail: "Árabe, nicho e inspiraciones" },
    { index: "02", title: "Mayorista", detail: "Franklin" },
    { index: "03", title: "Pago", detail: "Efectivo o transferencia" },
  ],
  brandFoot: "V 0.1 · Acceso restringido",
  accessKicker: "01 / Acceso",
  loginTitle: "Iniciar sesión",
  emailLabel: "Correo electrónico",
  emailPlaceholder: "nombre@sparksinsumos.com",
  passwordLabel: "Contraseña",
  showPassword: "Mostrar contraseña",
  hidePassword: "Ocultar contraseña",
  submit: "Entrar",
  missingFields: "Completá correo y contraseña.",
  invalidCredentials: "Credenciales inválidas.",
  forbidden: "Tu cuenta no tiene acceso al panel.",
  unavailable: "No pudimos iniciar sesión. Intentá de nuevo.",
  unauthorizedKicker: "Acceso",
  unauthorizedTitle: "No autorizado",
  unauthorizedMessage: "No podés entrar a esta sección sin iniciar sesión.",
  backToLogin: "Ir a iniciar sesión",
} as const;
