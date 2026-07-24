"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Check } from "lucide-react";
import { useAuth } from "@/app/providers";

const POINTS = [
  "150+ verified desi & global foods",
  "TDEE-accurate calories and macros",
  "Home or gym workouts + progress tracking",
];

export function AuthLayout({
  title, subtitle, children,
}: { title: string; subtitle: string; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-4xl items-stretch gap-0 overflow-hidden rounded-3xl border border-ink/[.07] bg-paper-card shadow-lift md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-night p-8 text-white md:flex">
        <img aria-hidden src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=85&w=1400&auto=format&fit=crop"
          alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" loading="lazy" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/85 to-night/95" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600 text-white ring-1 ring-leaf-700">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold">NutriFit<span className="text-leaf-400"> PK</span></span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Real plans for<br /><span className="italic text-ember-400">real</span> results.
          </h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-white/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember-400" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">Estimates for planning, not medical advice.</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center p-8 sm:p-10">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1 text-ink-muted">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
