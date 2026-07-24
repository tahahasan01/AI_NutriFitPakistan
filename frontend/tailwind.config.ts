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
        // Accent: warm coral / red-orange — energetic + premium, used sparingly
        brand: {
          50: "#fff4f0", 100: "#ffe4da", 200: "#ffc6b3", 300: "#ff9f81",
          400: "#fb7854", 500: "#f2542d", 600: "#dd4222", 700: "#b8331a",
          800: "#8f2917", 900: "#6b2013",
        },
        // Secondary energy accent: ember amber
        ember: {
          50: "#fff8ed", 100: "#ffefd0", 200: "#fddba1", 300: "#fcc267",
          400: "#f7a63a", 500: "#ef8b1a", 600: "#d47110", 700: "#b05a10",
        },
        // Fixed dark panel surface (dark in BOTH themes)
        night: { DEFAULT: "#17181c", soft: "#1f2026", ring: "#2a2b32" },
        saffron: { 50: "#fdf6e9", 100: "#f9e7c2", 200: "#f0c977", 300: "#e8a317", 400: "#c9860c" },
        macro: { protein: "#8b93f8", carbs: "#f5a524", fat: "#f43f5e", kcal: "#f2542d" },
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
