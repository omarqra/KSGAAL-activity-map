/* eslint-disable max-lines */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { THEME_PRESETS } from "@/configs/theme-presets";
import {
  hexToOklch,
  hslToHex as legacyHslToHex,
  oklchToHex,
} from "@/utils/colors-helper";

export type ThemeVars = Record<string, string>;

type ThemePresetInfo = {
  value: number;
  label: string;
} | null;

type ThemeState = {
  vars: ThemeVars;
  snapshot: ThemeVars;
  logoUrl: string;
  themePreset: ThemePresetInfo;
  setVars: (vars: ThemeVars) => void;
  applyVars: (vars: ThemeVars) => void;
  commit: () => void;
  rollback: () => void;
  setLogoUrl: (url: string) => void;
  setThemePreset: (preset: ThemePresetInfo) => void;
  initializeFromBackend: (data: {
    theme: ThemeVars;
    logoUrl: string;
    themePreset?: ThemePresetInfo;
  }) => void;
  loadThemeFromAPI: () => Promise<void>;
  resetVars: () => void;
  resetLogo: () => void;
  resetTheme: () => void;
  getColorsAsHex: () => {
    primary: string;
    primary_foreground: string;
    secondary: string;
    secondary_foreground: string;
  };
};

// Legacy function kept for backward compatibility, but now uses OKLCH internally
// This function converts OKLCH (or legacy HSL) to HEX
export const hslToHex = (color: string): string => {
  if (!color || color.trim() === "") return "";

  // If it's already OKLCH format, convert it directly
  if (color.startsWith("oklch(")) {
    return oklchToHex(color);
  }

  // If it's HEX format, return as is
  if (color.startsWith("#")) {
    return color;
  }

  // If it's HSL format (legacy: "240 41.4634% 8.0392%"), convert using legacy method
  // Check if it matches HSL pattern (3 space-separated values, second and third have %)
  const hslPattern = /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/;
  if (hslPattern.test(color.trim())) {
    // Use legacy HSL converter for backward compatibility
    return legacyHslToHex(color);
  }

  // If it doesn't match any known format, try to treat it as OKLCH
  // This maintains backward compatibility while supporting the new format
  try {
    return oklchToHex(color);
  } catch {
    // If conversion fails, return empty string
    return "";
  }
};

// Store current vars for re-application on mode change
let currentStoredVars: ThemeVars = {};
let darkModeObserver: MutationObserver | null = null;

const applyVarsToCSS = (vars: ThemeVars) => {
  const root = document.documentElement;
  const isDarkMode = root.classList.contains("dark");

  // Store vars for re-application on mode change
  currentStoredVars = { ...vars };

  // Separate light and dark vars
  const lightVars: Record<string, string> = {};
  const darkVars: Record<string, string> = {};

  Object.entries(vars).forEach(([key, value]) => {
    if (key.endsWith("_dark")) {
      const baseKey = key.replace("_dark", "").replace(/_/g, "-");
      darkVars[baseKey] = value;
    } else {
      const cssKey = key.replace(/_/g, "-");
      lightVars[cssKey] = value;
    }
  });

  // Get all unique CSS keys
  const allCssKeys = new Set([
    ...Object.keys(lightVars),
    ...Object.keys(darkVars),
  ]);

  // Apply vars based on current mode
  allCssKeys.forEach((cssKey) => {
    if (isDarkMode) {
      const valueToApply = darkVars[cssKey] ?? lightVars[cssKey];
      if (valueToApply) {
        root.style.setProperty(`--${cssKey}`, valueToApply);
      }
    } else {
      if (lightVars[cssKey]) {
        root.style.setProperty(`--${cssKey}`, lightVars[cssKey]);
      } else {
        root.style.removeProperty(`--${cssKey}`);
      }
    }
  });
};

// Set up MutationObserver to re-apply vars when dark mode toggles
const setupDarkModeObserver = () => {
  if (darkModeObserver) {
    darkModeObserver.disconnect();
    darkModeObserver = null;
  }

  const root = document.documentElement;

  // Observe class changes on documentElement
  darkModeObserver = new MutationObserver(() => {
    // Re-apply vars when dark class is toggled
    if (Object.keys(currentStoredVars).length > 0) {
      applyVarsToCSS(currentStoredVars);
    }
  });

  darkModeObserver.observe(root, {
    attributes: true,
    attributeFilter: ["class"],
  });
};

// Get all valid TweakCN theme keys from presets (both light and dark)
const getTweakCNThemeKeys = (): string[] => {
  // Get all unique keys from the first preset (they all have the same structure)
  const keys = new Set<string>();
  if (THEME_PRESETS && THEME_PRESETS.length > 0) {
    Object.keys(THEME_PRESETS[0].theme).forEach((key) => {
      keys.add(key);
    });
  }
  return Array.from(keys);
};

// Get empty theme object with all keys set to empty string
const getEmptyTheme = (): ThemeVars => {
  const keys = getTweakCNThemeKeys();
  const emptyTheme: ThemeVars = {};
  keys.forEach((key) => {
    emptyTheme[key] = "";
  });
  return emptyTheme;
};

const removeVarsFromCSS = () => {
  const root = document.documentElement;

  // Only remove TweakCN theme variables, not other custom vars
  const themeKeys = getTweakCNThemeKeys();

  // Convert theme keys to CSS format (underscores to hyphens, remove _dark suffix for CSS key)
  const cssKeysToRemove = new Set<string>();
  themeKeys.forEach((key) => {
    if (key.endsWith("_dark")) {
      const baseKey = key.replace("_dark", "").replace(/_/g, "-");
      cssKeysToRemove.add(baseKey);
    } else {
      const cssKey = key.replace(/_/g, "-");
      cssKeysToRemove.add(cssKey);
    }
  });

  // Remove from root (applies to both light and dark since .dark is on root)
  cssKeysToRemove.forEach((cssKey) => {
    root.style.removeProperty(`--${cssKey}`);
  });
};

const defaultVars: ThemeVars = {};

export const useThemeStore = create(
  persist<ThemeState>(
    (set, get) => ({
      vars: defaultVars,
      snapshot: defaultVars,
      logoUrl: "",
      themePreset: null,

      setVars: (vars) => {
        set({ vars });
      },

      applyVars: (vars) => {
        set({ vars });
        applyVarsToCSS(vars);
        // Ensure observer is set up to handle mode changes
        if (typeof window !== "undefined") {
          setupDarkModeObserver();
        }
      },

      commit: () => {
        const currentVars = get().vars;
        set({ snapshot: { ...currentVars } });
      },

      rollback: () => {
        const snapshot = get().snapshot;
        set({ vars: { ...snapshot } });
        applyVarsToCSS(snapshot);
      },

      setLogoUrl: (url) => {
        set({ logoUrl: url });
      },

      setThemePreset: (preset) => {
        set({ themePreset: preset });
      },

      initializeFromBackend: (data) => {
        const themeVars: ThemeVars = {};

        // Convert hex colors to OKLCH if they exist, or keep OKLCH as is
        if (data.theme) {
          Object.entries(data.theme).forEach(([key, value]) => {
            if (typeof value === "string" && value.startsWith("#")) {
              themeVars[key] = hexToOklch(value);
            } else if (typeof value === "string") {
              // If it's already OKLCH or other format, keep it as is
              themeVars[key] = value;
            }
          });
        }

        set({
          vars: themeVars,
          snapshot: { ...themeVars },
          logoUrl: data.logoUrl || "",
          themePreset: data.themePreset || null,
        });
        applyVarsToCSS(themeVars);
        // Ensure observer is set up to handle mode changes
        if (typeof window !== "undefined") {
          setupDarkModeObserver();
        }
      },

      loadThemeFromAPI: async () => {
        // No-op: the /themes/public/theme endpoint is a Next-template feature
        // that this project doesn't use. Theme state is hydrated from
        // localStorage by zustand's persist middleware (see onRehydrateStorage
        // below), so no network call is needed on app load.
      },

      resetVars: () => {
        // Only reset theme vars, keep logo and other non-theme data
        // Set all theme keys to empty string
        const emptyTheme = getEmptyTheme();
        set({ vars: emptyTheme });
        removeVarsFromCSS();
      },

      resetLogo: () => {
        set({ logoUrl: "" });
      },

      resetTheme: () => {
        set({
          vars: defaultVars,
          snapshot: defaultVars,
          logoUrl: "",
          themePreset: null,
        });
        removeVarsFromCSS();
        localStorage.removeItem("theme-store");
      },

      getColorsAsHex: () => {
        const vars = get().vars;
        return {
          primary: oklchToHex(vars.primary || ""),
          primary_foreground: oklchToHex(vars.primary_foreground || ""),
          secondary: oklchToHex(vars.secondary || ""),
          secondary_foreground: oklchToHex(vars.secondary_foreground || ""),
        };
      },
    }),
    {
      name: "theme-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.vars) {
          applyVarsToCSS(state.vars);
          // Set up observer after rehydration
          if (typeof window !== "undefined") {
            setupDarkModeObserver();
          }
        }
      },
    }
  )
);
