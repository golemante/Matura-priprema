import { Link } from "react-router-dom";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";

export function TermsPage() {
  usePageTitle(PAGE_TITLES.terms);
  return (
    <div className="page-container py-10 md:py-14 max-w-3xl">
      <h1 className="text-3xl font-bold text-warm-900 mb-4">
        Uvjeti korištenja
      </h1>
      <p className="text-warm-600 leading-relaxed mb-4">
        Ova stranica trenutno sadrži privremeni informativni tekst dok se ne
        objavi službena verzija uvjeta korištenja.
      </p>
      <p className="text-warm-600 leading-relaxed mb-8">
        Korištenjem platforme prihvaćaš osnovna pravila korektnog korištenja,
        zaštite korisničkog računa i poštivanja sadržaja dostupnog na MaturaPrip
        platformi.
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
