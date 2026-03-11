// lib/normalizeError.js

const KNOWN_CODES = {
  invalid_credentials: "Pogrešan email ili lozinka.",
  user_already_exists: "Korisnik s tim emailom već postoji.",
  email_not_confirmed: "Potvrdi email adresu prije prijave.",
  token_expired: "Sesija je istekla. Prijavi se ponovo.",
  session_not_found: "Sesija nije pronađena. Prijavi se ponovo.",
  weak_password: "Lozinka je preslaba. Koristi najmanje 8 znakova.",
  over_email_send_rate_limit: "Previše zahtjeva. Pokušaj za nekoliko minuta.",

  PGRST116: "Traženi zapis ne postoji.", // 0 rows returned on .single()
  42501: "Nemate dozvolu za ovu radnju.", // RLS violation
  23505: "Taj zapis već postoji.", // unique constraint
  23503: "Referencirani zapis ne postoji.", // FK violation

  NETWORK_ERROR: "Nema internetske veze. Provjeri spojivost.",
};

const FALLBACK_MESSAGE = "Došlo je do greške. Pokušaj ponovo.";

/**
 * @param {unknown} err - Bilo što bacano iz Supabase ili fetch poziva
 * @returns {{ message: string, code: string|null, isNetworkError: boolean }}
 */
export function normalizeError(err) {
  if (!err) {
    return { message: FALLBACK_MESSAGE, code: null, isNetworkError: false };
  }

  if (
    err instanceof TypeError &&
    (err.message?.includes("fetch") || err.message?.includes("network"))
  ) {
    return {
      message: KNOWN_CODES["NETWORK_ERROR"],
      code: "NETWORK_ERROR",
      isNetworkError: true,
    };
  }

  const code = err?.code ?? err?.error_code ?? null;
  const message = err?.message ?? err?.error_description ?? null;

  if (code && KNOWN_CODES[code]) {
    return { message: KNOWN_CODES[code], code, isNetworkError: false };
  }

  if (typeof message === "string") {
    if (message.toLowerCase().includes("jwt expired")) {
      return {
        message: KNOWN_CODES["token_expired"],
        code: "token_expired",
        isNetworkError: false,
      };
    }
    if (message.toLowerCase().includes("row-level security")) {
      return {
        message: KNOWN_CODES["42501"],
        code: "42501",
        isNetworkError: false,
      };
    }
    if (message.toLowerCase().includes("invalid login credentials")) {
      return {
        message: KNOWN_CODES["invalid_credentials"],
        code: "invalid_credentials",
        isNetworkError: false,
      };
    }
  }

  const userFacingMessage =
    typeof message === "string" && message.length < 200
      ? message
      : FALLBACK_MESSAGE;

  return { message: userFacingMessage, code, isNetworkError: false };
}

export function throwNormalized(err) {
  const normalized = normalizeError(err);
  const wrapped = new Error(normalized.message);
  wrapped.code = normalized.code;
  wrapped.isNetworkError = normalized.isNetworkError;
  throw wrapped;
}
