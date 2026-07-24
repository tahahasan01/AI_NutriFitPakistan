import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { PrefsProvider } from "@/components/PrefsProvider";
import { Shell } from "@/components/Shell";

// Set the theme class before paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('nutrifit_theme')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

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
            <Shell>{children}</Shell>
          </AuthProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
