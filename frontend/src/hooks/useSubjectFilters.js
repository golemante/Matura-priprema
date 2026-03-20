import { useSearchParams } from "react-router-dom";

export function useSubjectFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filterYear = searchParams.get("year")
    ? Number(searchParams.get("year"))
    : null;
  const filterLevel = searchParams.get("level") ?? null;
  const filterSession = searchParams.get("session") ?? null;

  const hasActiveFilters =
    filterYear !== null || filterLevel !== null || filterSession !== null;

  function setFilter(key, value) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null) next.delete(key);
        else next.set(key, String(value));
        return next;
      },
      { replace: true },
    );
  }

  function resetFilters() {
    setSearchParams({}, { replace: true });
  }

  return {
    filterYear,
    filterLevel,
    filterSession,
    hasActiveFilters,
    setFilter,
    resetFilters,
  };
}
