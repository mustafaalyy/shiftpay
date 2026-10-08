import { useEffect, useState } from "react";

export function makeId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[ShiftPay Storage] Failed to persist key "${key}":`, err?.message || err);
      if (err?.name === "QuotaExceededError" && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("shiftpay:storage-quota-exceeded", { detail: { key } })
        );
      }
    }
  }, [key, value]);

  return [value, setValue];
}
