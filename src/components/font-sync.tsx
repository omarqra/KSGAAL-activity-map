"use client";

import { useFontApply } from "@/store/font-store";

/**
 * Mounted once at the root so data-font on <html> stays in sync with the
 * persisted font choice on every navigation, including locale switches
 * (which re-render the root layout and would otherwise wipe the attribute).
 */
export function FontSync() {
  useFontApply();
  return null;
}
