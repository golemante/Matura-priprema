import { useState, useCallback, useEffect, useRef } from "react";
import { storage } from "@/utils/storage";

export function useLocalStorage(key, initialValue) {
  const [stored, setStored] = useState(() => storage.get(key, initialValue));

  const storedRef = useRef(stored);

  useEffect(() => {
    storedRef.current = stored;
  }, [stored]);

  const prevKeyRef = useRef(key);
  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      const next = storage.get(key, initialValue);
      storedRef.current = next;
      setStored(next);
    }
  }, [key, initialValue]);

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
