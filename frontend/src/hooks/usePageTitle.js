// hooks/usePageTitle.js
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
    const fullTitle = pageTitle ? `${pageTitle} | ${APP_NAME}` : APP_NAME;

    document.title = fullTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    return () => {
      document.title = APP_NAME;
    };
  }, [pageTitle, description]);
}

export const PAGE_TITLES = {
  home: null,
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
