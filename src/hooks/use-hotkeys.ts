import { useEffect, useRef } from "react";

type Handler = (e: KeyboardEvent) => void;

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

/** Single-key shortcuts ("j", "?", "Escape") and two-key sequences ("g t"). Ignored while typing in a field. */
export function useHotkeys(map: Record<string, Handler>, enabled = true) {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) return;
    let pending: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target) && e.key !== "Escape") return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const shifted = e.key === "?" ? "?" : key;

      if (pending) {
        const combo = `${pending} ${shifted}`;
        pending = null;
        clearTimeout(timer);
        if (mapRef.current[combo]) {
          e.preventDefault();
          mapRef.current[combo](e);
          return;
        }
      }
      if (Object.keys(mapRef.current).some((k) => k.startsWith(`${shifted} `))) {
        pending = shifted;
        timer = setTimeout(() => (pending = null), 900);
        return;
      }
      const handler = mapRef.current[shifted];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [enabled]);
}
