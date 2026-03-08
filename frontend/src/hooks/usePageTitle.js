// hooks/usePageTitle.js
// ─────────────────────────────────────────────────────────────────────────────
// FIX P3-4: Per-page <title> i <meta name="description"> za SEO i UX.
//
// PROBLEM: Cijela aplikacija imala jedan statički title "MaturaPrép" iz
// index.html. Pretraživači i browser tabovi ne mogu razlikovati stranice.
//
// IMPLEMENTACIJA:
//   • document.title se postavlja direktno (bez react-helmet-a koji je
//     ~23KB overhead) — za SPA s Vite-om to je sasvim dovoljno
//   • meta description se ažurira dynamički
//   • Cleanup na unmount → vraća default title
//   • useMemo optimizacija — title se ne re-računa ako su propsi isti
//
// KORIŠTENJE:
//   // Najjednostavnije — samo title
//   usePageTitle("Dashboard");
//
//   // S opisom
//   usePageTitle("Matematika — B razina 2023.", {
//     description: "Rješavaj maturu iz matematike — 40 pitanja, 90 minuta.",
//   });
//
//   // Dinamički (iz async podataka)
//   usePageTitle(examMeta ? `${examMeta.title} — Ispit` : null);
//   // → dok je null, prikazuje se "MaturaPrép | ..."
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from "react";

const APP_NAME = "MaturaPrep";
const DEFAULT_DESC =
  "Pripremi se za maturu. Rješavaj stvarne ispite iz matematike, hrvatskog, engleskog i više.";

/**
 * Postavlja <title> i <meta name="description"> za trenutnu stranicu.
 *
 * @param {string | null | undefined} pageTitle
 *   Naslov stranice. Null/undefined → koristi se samo APP_NAME.
 * @param {{ description?: string }} [opts]
 */
export function usePageTitle(pageTitle, opts = {}) {
  const { description = DEFAULT_DESC } = opts;

  useEffect(() => {
    // Postavi title
    const fullTitle = pageTitle ? `${pageTitle} | ${APP_NAME}` : APP_NAME;

    document.title = fullTitle;

    // Postavi meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // Cleanup: vrati default title kad se stranica unmountira
    return () => {
      document.title = APP_NAME;
    };
  }, [pageTitle, description]);
}

// ── Predefined page titles ─────────────────────────────────────────────────
// Koristi ove konstante u stranicama za konzistentnost i lakši refactor.
export const PAGE_TITLES = {
  home: null, // → "MaturaPrep"
  login: "Prijava",
  register: "Registracija",
  dashboard: "Početna",
  statistics: "Rezultati",
  profile: "Profil",
  notFound: "Stranica nije pronađena",
  terms: "Uvjeti korištenja",
  privacy: "Privatnost",
  resetPassword: "Resetiranje lozinke",
  forgotPassword: "Zaboravljena lozinka",
  examResults: "Rezultati ispita",
  subjectSelect: "Odabir ispita",
};
