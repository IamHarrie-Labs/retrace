"use client";

import { useCallback, useSyncExternalStore } from "react";

// Only public transaction identifiers and display preferences belong here.
// The fallback keeps controls usable when browser storage is unavailable.
const fallback = new Map<string, string | null>();
const changed = "retrace:browser-storage";
const serverSnapshot = () => null;

export function useBrowserStorage(key: string) {
  const read = useCallback(() => {
    if (fallback.has(key)) return fallback.get(key) ?? null;
    try { return localStorage.getItem(key); } catch { return null; }
  }, [key]);
  const subscribe = useCallback((notify: () => void) => {
    const external = (event: StorageEvent) => {
      if (event.key === key || event.key === null) { fallback.delete(key); notify(); }
    };
    window.addEventListener("storage", external);
    window.addEventListener(changed, notify);
    return () => { window.removeEventListener("storage", external); window.removeEventListener(changed, notify); };
  }, [key]);
  const value = useSyncExternalStore(subscribe, read, serverSnapshot);
  const write = useCallback((next: string | null) => {
    fallback.set(key, next);
    try { if (next === null) localStorage.removeItem(key); else localStorage.setItem(key, next); } catch { /* Retain the in-memory value. */ }
    window.dispatchEvent(new Event(changed));
  }, [key]);
  return [value, write] as const;
}
