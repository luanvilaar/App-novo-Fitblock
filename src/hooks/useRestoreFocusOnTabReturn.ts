import { useEffect } from "react";

export function useRestoreFocusOnTabReturn() {
  useEffect(() => {
    let savedEl: Element | null = null;

    const handler = () => {
      if (document.hidden) {
        savedEl = document.activeElement;
      } else if (
        savedEl &&
        savedEl.isConnected &&
        (savedEl instanceof HTMLInputElement || savedEl instanceof HTMLTextAreaElement)
      ) {
        const el = savedEl;
        requestAnimationFrame(() => {
          el.focus();
          el.selectionStart = el.selectionEnd = el.value.length;
        });
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
}
