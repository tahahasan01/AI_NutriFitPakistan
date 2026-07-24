"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./providers";
import { ApiError } from "@/lib/api";

export default function HomePage() {
  const { user, loading, login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  if (!loading && user) {
    return (
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold">Welcome back, {user.name || "athlete"} 👋</h1>
        <p className="mt-2 text-slate-600">Pick up where you left off.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { href: "/diet", title: "Diet Plan", emoji: "🍲" },
            { href: "/workout", title: "Workout", emoji: "🏋️" },
            { href: "/progress", title: "Progress", emoji: "📈" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="card hover:border-brand">
              <div className="text-3xl">{c.emoji}</div>
              <div className="mt-2 font-semibold">{c.title}</div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="grid items-center gap-10 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold leading-tight">
          Personalized nutrition & fitness,{" "}
          <span className="text-brand">built for Pakistan.</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          TDEE-based 7-day meal plans with local cuisine, 6-day workout splits, and
          weekly progress tracking with plateau detection.
        </p>
        <ul className="mt-6 space-y-2 text-slate-700">
          <li>✅ Mifflin–St Jeor targets with correct Atwater macros</li>
          <li>✅ Desi-first meal selection and smart swaps</li>
          <li>✅ Home or gym workouts with calorie estimates</li>
        </ul>
      </div>

      <div className="card mx-auto w-full max-w-md">
        <div className="mb-4 flex rounded-lg bg-slate-100 p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium capitalize ${
                mode === m ? "bg-white shadow-sm text-brand" : "text-slate-500"
              }`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.name}
                  onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div>
                <label className="label">Phone (optional)</label>
                <input className="input" value={form.phone}
                  onChange={(e) => update("phone", e.target.value)} />
              </div>
            </>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email}
              onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" value={form.password}
              onChange={(e) => update("password", e.target.value)}
              minLength={mode === "signup" ? 8 : undefined} required />
            {mode === "signup" && (
              <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-brand">{notice}</p>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </section>
  );
}
