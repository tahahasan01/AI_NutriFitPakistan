import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      colors: {
        // Warm paper system — CSS-variable driven so it flips in dark mode
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
          warm: "rgb(var(--paper-warm) / <alpha-value>)",
          card: "rgb(var(--paper-card) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        // Dominant: deep pine green
        brand: {
          50: "#eef4ef", 100: "#d6e7da", 200: "#aecfb6", 300: "#7db28c",
          400: "#4f9066", 500: "#2f6b46", 600: "#245538", 700: "#1c442e",
          800: "#153525", 900: "#0f2a1d",
        },
        // Pop accent
        lime: {
          50: "#f6faeb", 100: "#e9f4cf", 200: "#d3e9a0", 300: "#b8db6a",
          400: "#9fca3d", 500: "#84cc16", 600: "#66a30d", 700: "#4d7c0f",
        },
        // Desi warmth accent
        saffron: { 50: "#fdf6e9", 100: "#f9e7c2", 200: "#f0c977", 300: "#e8a317", 400: "#c9860c" },
        macro: { protein: "#5b6ee1", carbs: "#e8a317", fat: "#e0577b", kcal: "#2f6b46" },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(27,26,21,.05), 0 6px 20px rgba(27,26,21,.06)",
        lift: "0 12px 40px -8px rgba(27,26,21,.16)",
        pop: "0 6px 0 0 #1c442e",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(.96)" }, "100%": { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.16,1,.3,1) both",
        "fade-up-1": "fade-up .6s cubic-bezier(.16,1,.3,1) .08s both",
        "fade-up-2": "fade-up .6s cubic-bezier(.16,1,.3,1) .16s both",
        "scale-in": "scale-in .5s cubic-bezier(.16,1,.3,1) .1s both",
      },
    },
  },
  plugins: [],
};

export default config;
