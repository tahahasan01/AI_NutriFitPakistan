import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NutriFit Pakistan",
  description: "AI-assisted diet plans, workouts, and progress tracking for Pakistan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
