import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "NutriFit Pakistan — Nutrition & Fitness",
  description: "AI-assisted diet plans, workouts, and progress tracking for Pakistan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
          <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-ink-faint">
            NutriFit Pakistan · Estimates for planning, not medical advice.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
