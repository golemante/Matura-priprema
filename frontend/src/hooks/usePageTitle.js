import { useEffect } from "react";

const APP_NAME = "MaturaPro";
const DEFAULT_DESC =
  "Pripremi se za državnu maturu s pravim NCVVO ispitima — matematika, hrvatski, engleski i više.";

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
  dashboard: "Početna ploča",
  statistics: "Statistike",
  profile: "Profil",
  notFound: "Stranica nije pronađena",
  terms: "Uvjeti korištenja",
  privacy: "Politika privatnosti",
  resetPassword: "Nova lozinka",
  forgotPassword: "Zaboravljena lozinka",
  examResults: "Rezultati ispita",
  subjectSelect: "Odabir ispita",
  allSubjects: "Predmeti",
  about: "O projektu",
  contact: "Kontakt",
};
