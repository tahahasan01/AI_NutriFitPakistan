"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading…</div>;
  }
  if (!user) {
    return <div className="py-20 text-center text-slate-500">Redirecting to sign in…</div>;
  }
  return <>{children}</>;
}
