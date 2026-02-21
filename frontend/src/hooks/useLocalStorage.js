// hooks/useLocalStorage.js
import { useState, useCallback } from "react";
import { storage } from "@/utils/storage";

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => storage.get(key, initialValue));

  const setValue = useCallback(
    (value) => {
      const next = typeof value === "function" ? value(stored) : value;
      setStored(next);
      storage.set(key, next);
    },
    [key, stored],
  );

  const removeValue = useCallback(() => {
    setStored(initialValue);
    storage.remove(key);
  }, [key, initialValue]);

  return [stored, setValue, removeValue];
}
