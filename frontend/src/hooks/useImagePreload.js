// hooks/useImagePreload.js
// ─────────────────────────────────────────────────────────────────────────────
// NOVO — Asinkrono predučitavanje slika za iduća pitanja (Performance audit)
//
// ZAŠTO:
//   Pitanja s grafovima, dijagramima ili formulama (kemija, fizika, matematika)
//   imaju imageUrl. Bez preloading-a, slika se počne loadati tek kad korisnik
//   navigira na pitanje → vidljiv flash/skeleton koji remeti tečnost.
//
// IMPLEMENTACIJA:
//   • Preloada slike za iduća N pitanja (default: 3)
//   • Koristi native `new Image()` — nema React overhead-a
//   • Drži reference u Map-u da spriječi garbage collection
//   • Na cleanup unmount-a briše sve reference
//   • Ignorira null/undefined/već-viđene imageUrl-ove
//
// ŠTO SE PRELOADA:
//   1. question.imageUrl         (direktna slika pitanja)
//   2. passages s content koji sadrži <img> tagove — NE (preskočeno,
//      jer HTML slike handla browser parser automatski)
//
// KORIŠTENJE:
//   useImagePreload(questions, currentIndex, { ahead: 3 });
//
// NAPOMENA O SLICI PASSAGES:
//   PassageDisplay renderira passage.content kao HTML (DOMPurify).
//   Browser parser preuzima učitavanje slika iz <img> tagova automatski.
//   Nema potrebe za ručnim preloadingom passage HTML-a.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";

/**
 * Preloada imageUrl za iduća `ahead` pitanja u pozadini.
 *
 * @param {Array<{ id: string, imageUrl?: string | null }>} questions
 * @param {number} currentIndex  — trenutni indeks pitanja
 * @param {{ ahead?: number }}   opts
 */
export function useImagePreload(questions, currentIndex, { ahead = 3 } = {}) {
  // Drži Image objekte alive dok su potrebni (GC ne može ih prikupiti)
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!questions?.length) return;

    const cache = cacheRef.current;
    const start = currentIndex + 1;
    const end = Math.min(currentIndex + 1 + ahead, questions.length);

    for (let i = start; i < end; i++) {
      const url = questions[i]?.imageUrl;
      if (!url || cache.has(url)) continue;

      const img = new Image();
      img.src = url;
      cache.set(url, img);
    }

    // Cleanup: ukloni slike koje su previše daleko iza cursora
    // (drži max 20 u cacheu da ne trošimo memoriju)
    if (cache.size > 20) {
      const keys = Array.from(cache.keys());
      keys.slice(0, cache.size - 20).forEach((k) => cache.delete(k));
    }
  }, [questions, currentIndex, ahead]);

  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.clear();
    };
  }, []);
}
