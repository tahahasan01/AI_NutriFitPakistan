import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#16a34a",
          soft: "#22c55e",
          dark: "#15803d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
