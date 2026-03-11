// hooks/useImagePreload.js
import { useEffect, useRef } from "react";

/**
 * Preloada imageUrl za iduća `ahead` pitanja u pozadini.
 *
 * @param {Array<{ id: string, imageUrl?: string | null }>} questions
 * @param {number} currentIndex
 * @param {{ ahead?: number }}   opts
 */
export function useImagePreload(questions, currentIndex, { ahead = 3 } = {}) {
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
