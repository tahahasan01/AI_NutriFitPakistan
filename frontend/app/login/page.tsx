"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthForm } from "@/components/AuthForm";

function LoginInner() {
  const isNew = useSearchParams().get("new");
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to pick up your plan.">
      {isNew && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-brand-100">
          <Check className="h-4 w-4" /> Account created — please log in.
        </p>
      )}
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-ink-muted">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
