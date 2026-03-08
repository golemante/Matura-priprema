import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <div className="page-container py-10 md:py-14 max-w-3xl">
      <h1 className="text-3xl font-bold text-warm-900 mb-4">
        Politika privatnosti
      </h1>
      <p className="text-warm-600 leading-relaxed mb-4">
        Ova stranica trenutno sadrži privremeni informativni tekst dok se ne
        objavi službena politika privatnosti.
      </p>
      <p className="text-warm-600 leading-relaxed mb-8">
        Podaci se obrađuju isključivo u svrhu autentikacije, korištenja
        funkcionalnosti platforme i prikaza rezultata, uz primjenu razumnih
        sigurnosnih mjera.
      </p>
      <Link
        to="/"
        className="text-primary-600 font-medium hover:text-primary-700"
      >
        ← Povratak na početnu
      </Link>
    </div>
  );
}
