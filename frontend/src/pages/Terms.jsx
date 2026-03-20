import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/Wrapper";
import { usePageTitle, PAGE_TITLES } from "@/hooks/usePageTitle";

export function TermsPage() {
  usePageTitle(PAGE_TITLES.terms);

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-warm-900 tracking-tight">
              Uvjeti korištenja
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
              ne objavi službena verzija uvjeta korištenja.
            </p>
          </div>

          <div className="bg-white border border-warm-200 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-warm-900 mb-1.5">
                Prihvaćanje uvjeta
              </h2>
              <p className="text-sm text-warm-600 leading-relaxed">
                Korištenjem platforme MaturaPro prihvaćaš ove uvjete korištenja.
                Ako se ne slažeš s uvjetima, molimo te da prestaneš koristiti
                platformu.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-warm-900 mb-1.5">
                Korektno korištenje
              </h2>
              <p className="text-sm text-warm-600 leading-relaxed">
                Korisnici su dužni platformu koristiti u skladu s osnovnim
                pravilima korektnog ponašanja i zaštite vlastitog korisničkog
                računa.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-warm-900 mb-1.5">
                Sadržaj platforme
              </h2>
              <p className="text-sm text-warm-600 leading-relaxed">
                Svi ispiti dostupni na platformi preuzeti su s javno dostupnih
                materijala NCVVO-a i služe isključivo u obrazovne svrhe.
                MaturaPro nije u formalnoj suradnji s NCVVO-om.
              </p>
            </div>

            <div>
              <h2 className="text-base font-bold text-warm-900 mb-1.5">
                Ograničenje odgovornosti
              </h2>
              <p className="text-sm text-warm-600 leading-relaxed">
                Platforma se pruža &ldquo;kakva jest&rdquo; bez garancija o
                točnosti ili dostupnosti sadržaja. Koristite je na vlastitu
                odgovornost.
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
