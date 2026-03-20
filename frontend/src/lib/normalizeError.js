const KNOWN_CODES = {
  invalid_credentials: "Pogrešan email ili lozinka.",
  user_already_exists: "Korisnik s tim emailom već postoji.",
  email_exists: "Korisnik s tim emailom već postoji.",
  email_not_confirmed: "Potvrdi email adresu prije prijave.",
  token_expired: "Sesija je istekla. Prijavi se ponovo.",
  session_not_found: "Sesija nije pronađena. Prijavi se ponovo.",
  weak_password: "Lozinka je preslaba. Koristi najmanje 8 znakova.",
  over_email_send_rate_limit: "Previše zahtjeva. Pokušaj za nekoliko minuta.",
  over_request_rate_limit:
    "Previše zahtjeva. Pričekaj trenutak i pokušaj ponovo.",
  user_banned: "Ovaj korisnički račun je blokiran. Kontaktiraj podršku.",

  PGRST116: "Traženi zapis ne postoji.",
  PGRST301: "Sesija je istekla. Prijavi se ponovo.",

  42501: "Nemate dozvolu za ovu radnju.",
  23505: "Taj zapis već postoji.",
  23503: "Referencirani zapis ne postoji.",
  23000: "Podaci nisu valjani. Provjeri unos.",
  23502: "Nedostaje obavezni podatak.",

  NETWORK_ERROR: "Nema internetske veze. Provjeri spojivost.",
};

const FALLBACK_MESSAGE = "Došlo je do greške. Pokušaj ponovo.";

export function normalizeError(err) {
  if (!err) {
    return { message: FALLBACK_MESSAGE, code: null, isNetworkError: false };
  }

  if (typeof err === "string") {
    return {
      message: err.length < 200 ? err : FALLBACK_MESSAGE,
      code: null,
      isNetworkError: false,
    };
  }

  if (
    err instanceof TypeError &&
    (err.message?.includes("fetch") ||
      err.message?.includes("network") ||
      err.message?.includes("Failed to fetch"))
  ) {
    return {
      message: KNOWN_CODES["NETWORK_ERROR"],
      code: "NETWORK_ERROR",
      isNetworkError: true,
    };
  }

  const httpStatus = err?.status ?? err?.statusCode ?? null;
  if (httpStatus === 429) {
    return {
      message: KNOWN_CODES["over_request_rate_limit"],
      code: "over_request_rate_limit",
      isNetworkError: false,
    };
  }
  if (httpStatus === 401) {
    return {
      message: KNOWN_CODES["token_expired"],
      code: "token_expired",
      isNetworkError: false,
    };
  }
  if (httpStatus === 403) {
    return {
      message: KNOWN_CODES["42501"],
      code: "42501",
      isNetworkError: false,
    };
  }

  const code = err?.code ?? err?.error_code ?? null;
  const message = err?.message ?? err?.error_description ?? null;

  if (code && KNOWN_CODES[code]) {
    return { message: KNOWN_CODES[code], code, isNetworkError: false };
  }

  if (typeof message === "string") {
    const lower = message.toLowerCase();

    if (lower.includes("jwt expired") || lower.includes("token is expired")) {
      return {
        message: KNOWN_CODES["token_expired"],
        code: "token_expired",
        isNetworkError: false,
      };
    }
    if (
      lower.includes("row-level security") ||
      lower.includes("new row violates")
    ) {
      return {
        message: KNOWN_CODES["42501"],
        code: "42501",
        isNetworkError: false,
      };
    }
    if (
      lower.includes("invalid login credentials") ||
      lower.includes("invalid email or password")
    ) {
      return {
        message: KNOWN_CODES["invalid_credentials"],
        code: "invalid_credentials",
        isNetworkError: false,
      };
    }
    if (
      lower.includes("already registered") ||
      lower.includes("already exists")
    ) {
      return {
        message: KNOWN_CODES["email_exists"],
        code: "email_exists",
        isNetworkError: false,
      };
    }
    if (lower.includes("email not confirmed")) {
      return {
        message: KNOWN_CODES["email_not_confirmed"],
        code: "email_not_confirmed",
        isNetworkError: false,
      };
    }
    if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
      return {
        message: KNOWN_CODES["NETWORK_ERROR"],
        code: "NETWORK_ERROR",
        isNetworkError: true,
      };
    }

    const userFacingMessage = message.length < 200 ? message : FALLBACK_MESSAGE;
    return { message: userFacingMessage, code, isNetworkError: false };
  }

  return { message: FALLBACK_MESSAGE, code, isNetworkError: false };
}

export function throwNormalized(err) {
  const normalized = normalizeError(err);
  const wrapped = new Error(normalized.message);
  wrapped.code = normalized.code;
  wrapped.isNetworkError = normalized.isNetworkError;
  throw wrapped;
}
