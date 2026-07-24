"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/providers";
import { ApiError } from "@/lib/api";

export function AuthCard() {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null); setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        router.push("/diet");
      } else {
        await signup(form.name, form.email, form.phone, form.password);
        setNotice("Account created! Please log in.");
        setMode("login");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  return (
    <div id="auth" className="card w-full max-w-md shadow-lift">
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {(["signup", "login"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(null); }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              mode === m ? "bg-white text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink"}`}>
            {m === "signup" ? "Sign up" : "Log in"}
          </button>
        ))}
      </div>

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

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">{error}</p>}
        {notice && (
          <p className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-brand-100">
            <Check className="h-4 w-4" /> {notice}
          </p>
        )}

        <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
          {busy ? "Please wait…" : mode === "signup" ? "Create free account" : "Log in"}
          {!busy && <ArrowRight className="h-4 w-4" />}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-faint">
          <ShieldCheck className="h-3.5 w-3.5" /> No credit card · Your data stays private
        </p>
      </form>
    </div>
  );
}
