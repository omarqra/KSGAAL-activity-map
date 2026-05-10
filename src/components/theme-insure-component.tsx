"use client";

import { useEffect } from "react";

import { useThemeStore } from "@/store/theme-store";

export function ThemeInitializer() {
  useEffect(() => {
    const load = async () => {
      await useThemeStore.getState().loadThemeFromAPI();
    };
    load();
  }, []);

  return null;
}