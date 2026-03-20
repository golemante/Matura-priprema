import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";

export function PrivacyPage() {
  usePageTitle(PAGE_TITLES.privacy);

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-warm-900 tracking-tight">
              Politika privatnosti
            </h1>
            <p className="text-sm text-warm-400 mt-0.5">
              Zadnje ažuriranje: 2025.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-sm text-amber-800 font-medium">
              Ova stranica trenutno sadrži privremeni informativni tekst dok se
              ne objavi službena politika privatnosti.
            </p>
          </div>

          <div className="bg-white border border-warm-200 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-warm-900 mb-1.5">
                Prikupljanje podataka
              </h2>
              <p className="text-sm text-warm-600 leading-relaxed">
                Podaci se prikupljaju isključivo radi autentikacije korisnika i
                prikaza personaliziranih rezultata unutar platforme.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-warm-900 mb-1.5">
                Korištenje podataka
              </h2>
              <p className="text-sm text-warm-600 leading-relaxed">
                Podaci se obrađuju isključivo u svrhu autentikacije, korištenja
                funkcionalnosti platforme i prikaza rezultata, uz primjenu
                razumnih sigurnosnih mjera.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-warm-900 mb-1.5">
                Dijeljenje podataka
              </h2>
              <p className="text-sm text-warm-600 leading-relaxed">
                Tvoji osobni podaci ne dijele se s trećim stranama niti se
                koriste u komercijalne svrhe.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft size={14} />
          Povratak na početnu
        </Link>
      </div>
    </PageWrapper>
  );
}
