"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { useAuth } from "@/app/providers";

export function AuthLayout({
  title, subtitle, children,
}: { title: string; subtitle: string; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <div className="relative -mx-4 -my-8 flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4 py-12 sm:-mx-6 sm:px-6">
      {/* Athletic background */}
      <img aria-hidden loading="eager"
        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=85&w=2000&auto=format&fit=crop"
        alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden className="absolute inset-0 bg-black/70" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/55" />
      <div aria-hidden className="absolute -bottom-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-brand-400/12 blur-3xl" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-paper-card/85 p-7 shadow-lift backdrop-blur-xl sm:p-9">
        <Link href="/" className="mb-7 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-500 text-night"><Leaf className="h-5 w-5" /></span>
          <span className="font-display text-xl font-semibold">NutriFit<span className="text-leaf-500"> PK</span></span>
        </Link>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1.5 text-ink-muted">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
