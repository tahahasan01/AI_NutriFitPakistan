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
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Surfaces — CSS-variable driven (dark by default, optional light)
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
          warm: "rgb(var(--paper-warm) / <alpha-value>)",
          card: "rgb(var(--paper-card) / <alpha-value>)",
          elevated: "rgb(var(--paper-elevated) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        // PRIMARY — electric lime (the one punch color)
        brand: {
          50: "#f6ffe4", 100: "#eaffbf", 200: "#d6ff85", 300: "#c2fb4d",
          400: "#b6ff3c", 500: "#a3e635", 600: "#84cc16", 700: "#65a30d",
          800: "#4d7c0f", 900: "#3f6212",
        },
        // SECONDARY — teal (for gradients + soft accents). Kept name "ember"
        // so existing components pick up the new palette automatically.
        ember: {
          50: "#effcf9", 100: "#cbf6ee", 200: "#99ecdd", 300: "#5eead4",
          400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e",
        },
        // Emerald (gradient endpoint) + logo green
        spring: { 300: "#6ee7a8", 400: "#34d399", 500: "#22c55e", 600: "#16a34a" },
        leaf: { 300: "#6ee7a8", 400: "#34d399", 500: "#22c55e", 600: "#16a34a", 700: "#15803d" },
        // Soft lime-gold sparkle accents (kept name "saffron")
        saffron: { 50: "#fbffe8", 100: "#f4ffc2", 200: "#e8ff85", 300: "#d6f94a", 400: "#bde30f" },
        // Fixed dark panel surface
        night: { DEFAULT: "#0d0f0e", soft: "#141614", ring: "#242824" },
        // Macro data-viz (readable on dark)
        macro: { protein: "#8b93f8", carbs: "#2dd4bf", fat: "#f43f5e", kcal: "#a3e635" },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35)",
        lift: "0 20px 50px -12px rgba(0,0,0,.6)",
        glow: "0 0 0 1px rgba(182,255,60,.15), 0 8px 30px -6px rgba(163,230,53,.35)",
        pop: "0 6px 0 0 #4d7c0f",
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
