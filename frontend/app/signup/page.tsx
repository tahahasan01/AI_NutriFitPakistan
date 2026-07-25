"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Get your personalized plan in under a minute.">
      <AuthForm mode="signup" />
      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">Log in</Link>
      </p>
    </AuthLayout>
  );
}
