"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/app/providers";
import { ApiError } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        router.push("/dashboard");
      } else {
        await signup(form.name, form.email, form.phone, form.password);
        router.push("/login?new=1");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <>
          <div className="field">
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="field">
            <label className="label">Phone (optional)</label>
            <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </>
      )}
      <div className="field">
        <label className="label">Email</label>
        <input type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} required />
      </div>
      <div className="field">
        <label className="label">Password</label>
        <input type="password" className="input" value={form.password}
          onChange={(e) => update("password", e.target.value)}
          minLength={mode === "signup" ? 8 : undefined} required />
        {mode === "signup" && <p className="text-xs text-ink-faint">At least 8 characters.</p>}
      </div>

      {error && <p className="rounded-lg bg-rose-500/12 px-3 py-2 text-sm text-rose-400 ring-1 ring-rose-500/20">{error}</p>}

      <button type="submit" className="btn-accent w-full py-3" disabled={busy}>
        {busy ? "Please wait…" : mode === "signup" ? "Create free account" : "Log in"}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
