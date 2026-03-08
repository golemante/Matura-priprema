// lib/normalizeError.js
// ─────────────────────────────────────────────────────────────────────────────
// Pretvara Supabase PostgrestError / AuthError / plain Error u
// konzistentan oblik { message, code, isNetworkError } koji se
// može direktno prikazati korisniku.
//
// KORISTITI: u svim catch blokovima i onError handlerima.
// NIKAD ne prikazivati raw error.message korisniku bez ovog passthrouga.
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_CODES = {
  // Auth
  invalid_credentials: "Pogrešan email ili lozinka.",
  user_already_exists: "Korisnik s tim emailom već postoji.",
  email_not_confirmed: "Potvrdi email adresu prije prijave.",
  token_expired: "Sesija je istekla. Prijavi se ponovo.",
  session_not_found: "Sesija nije pronađena. Prijavi se ponovo.",
  weak_password: "Lozinka je preslaba. Koristi najmanje 8 znakova.",
  over_email_send_rate_limit: "Previše zahtjeva. Pokušaj za nekoliko minuta.",

  // Postgrest / DB
  PGRST116: "Traženi zapis ne postoji.", // 0 rows returned on .single()
  42501: "Nemate dozvolu za ovu radnju.", // RLS violation
  23505: "Taj zapis već postoji.", // unique constraint
  23503: "Referencirani zapis ne postoji.", // FK violation

  // Network
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

  // Mrežna greška (fetch fail, offline)
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

  // Supabase AuthError: { name: "AuthApiError", code: "...", message: "..." }
  // Supabase PostgrestError: { code: "...", message: "...", details: "...", hint: "..." }
  const code = err?.code ?? err?.error_code ?? null;
  const message = err?.message ?? err?.error_description ?? null;

  // Provjeri poznati code
  if (code && KNOWN_CODES[code]) {
    return { message: KNOWN_CODES[code], code, isNetworkError: false };
  }

  // JWT expired dolazi kao message string, ne code
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

  // Vraćamo originalnu message ako je čitljiva, inače fallback
  const userFacingMessage =
    typeof message === "string" && message.length < 200
      ? message
      : FALLBACK_MESSAGE;

  return { message: userFacingMessage, code, isNetworkError: false };
}

/**
 * Helper za direktno bacanje normaliziranog errora.
 * Koristi se u API sloju: throwNormalized(error)
 */
export function throwNormalized(err) {
  const normalized = normalizeError(err);
  const wrapped = new Error(normalized.message);
  wrapped.code = normalized.code;
  wrapped.isNetworkError = normalized.isNetworkError;
  throw wrapped;
}
