import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { PrefsProvider } from "@/components/PrefsProvider";
import { Navbar } from "@/components/Navbar";

// Set the theme class before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('nutrifit_theme')||'dark';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  title: "NutriFit Pakistan — Nutrition & Fitness",
  description: "Desi-first meal plans, workouts, and progress tracking, grounded in real nutrition science.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="font-sans">
        <PrefsProvider>
          <AuthProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
            <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-ink-faint">
              NutriFit Pakistan · Estimates for planning, not medical advice.
            </footer>
          </AuthProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
