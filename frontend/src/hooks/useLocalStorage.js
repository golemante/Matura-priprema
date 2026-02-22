// hooks/useLocalStorage.js
import { useState, useCallback, useRef } from "react";
import { storage } from "@/utils/storage";

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => storage.get(key, initialValue));
  const storedRef = useRef(stored);

  const setValue = useCallback(
    (value) => {
      const next =
        typeof value === "function" ? value(storedRef.current) : value;
      storedRef.current = next;
      setStored(next);
      storage.set(key, next);
    },
    [key],
  );

  const removeValue = useCallback(() => {
    storedRef.current = initialValue;
    setStored(initialValue);
    storage.remove(key);
  }, [key, initialValue]);

  return [stored, setValue, removeValue];
}
