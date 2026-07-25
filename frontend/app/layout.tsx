import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { PrefsProvider } from "@/components/PrefsProvider";
import { Shell } from "@/components/Shell";

// Dark by default (athletic look). Set the theme class before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('nutrifit_theme')||'dark';var d=t==='light'?false:(t==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:true);document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "NutriFit Pakistan — Nutrition & Fitness",
  description: "Desi-first meal plans, workouts, and progress tracking, grounded in real nutrition science.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
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
