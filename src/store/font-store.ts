import { useEffect } from "react";

import { usePathname } from "next/navigation";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type FontKey = "majalla" | "cairo";

const DEFAULT_FONT: FontKey = "cairo";

type FontStore = {
  font: FontKey;
  setFont: (font: FontKey) => void;
};

const applyToDOM = (font: FontKey) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-font", font);
};

export const useFontStore = create(
  persist<FontStore>(
    (set) => ({
      font: DEFAULT_FONT,
      setFont: (font) => {
        applyToDOM(font);
        set({ font });
      },
    }),
    {
      name: "font-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.font) applyToDOM(state.font);
      },
    }
  )
);

/**
 * Re-applies data-font on every pathname change. Locale switching via
 * next-intl's router re-renders the root [locale]/layout.tsx which can
 * wipe imperatively-set attributes on <html>; this keeps the choice
 * sticky across language toggles. Call inside any persistently-mounted
 * client component on dashboard pages (e.g. FontSwitcher in TopNav).
 */
export function useFontApply() {
  const font = useFontStore((s) => s.font);
  const pathname = usePathname();
  useEffect(() => {
    applyToDOM(font);
  }, [font, pathname]);
}
