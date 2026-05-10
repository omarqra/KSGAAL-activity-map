import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-cairo)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        num: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Client-mandated brand palette (source of truth — see CLAUDE.md)
        brand: {
          black: "#000000",
          green: "#024E28",
          greenDeep: "#082F18",
          gray: "#474747",
          light: "#CECECE",
          blue: "#193D58",
          teal: "#459AA8",
          yellow: "#F5CC44",
          orange: "#D56028",
          wine: "#57072D",
        },
        // Semantic tokens (all mapped to brand palette — do not introduce off-palette values)
        aws: {
          // Top nav
          squid: "#082F18",
          squid2: "#024E28",
          navy: "#193D58",
          // Actions
          orange: "#D56028",
          orange2: "#D56028",
          // Links
          link: "#459AA8",
          linkHover: "#024E28",
          // Borders & surfaces
          border: "#CECECE",
          border2: "#CECECE",
          bg: "#FFFFFF",
          bg2: "#FFFFFF",
          // Text hierarchy (3 levels — brand-only)
          text: "#000000",
          text2: "#474747",
          text3: "#474747",
          // Status (mapped to brand colors only — alpha for soft backgrounds)
          success: "#024E28",
          successBg: "#024E2814",
          warn: "#F5CC44",
          warnBg: "#F5CC4414",
          error: "#57072D",
          errorBg: "#57072D14",
          info: "#193D58",
          infoBg: "#193D5814",
        },
      },
      boxShadow: {
        "aws-card":
          "0 1px 1px 0 rgba(0,28,36,0.05), 0 1px 4px 0 rgba(0,28,36,0.08)",
        "aws-pop": "0 4px 12px 0 rgba(0,28,36,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;

