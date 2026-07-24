"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Salad, Dumbbell, LineChart, Sparkles, ArrowRight, Check } from "lucide-react";
import { useAuth } from "./providers";
import { ApiError } from "@/lib/api";

const features = [
  { icon: Salad, title: "TDEE meal plans", desc: "7-day plans from Mifflin–St Jeor targets with correct Atwater macros." },
  { icon: Dumbbell, title: "Smart workouts", desc: "6-day splits for home or gym with per-exercise calorie estimates." },
  { icon: LineChart, title: "Progress + plateau", desc: "Weekly weight tracking with trend charts and plateau detection." },
];

export default function HomePage() {
  const { user, loading, login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
      <section className="animate-fade-up">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Welcome back, {user.name?.split(" ")[0] || "athlete"} 👋
          </h1>
          <p className="mt-2 text-ink-muted">Pick up where you left off.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { href: "/diet", title: "Diet Plan", desc: "Generate this week's meals", icon: Salad },
            { href: "/workout", title: "Workout", desc: "Build your training split", icon: Dumbbell },
            { href: "/progress", title: "Progress", desc: "Log weight & see trends", icon: LineChart },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="card card-hover group">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <c.icon className="h-5 w-5" />
              </span>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-sm text-ink-muted">{c.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-1 group-hover:text-brand-600" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="grid items-center gap-12 py-4 lg:grid-cols-[1.1fr,0.9fr] lg:py-10">
      {/* Hero */}
      <div className="animate-fade-up">
        <span className="badge bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <Sparkles className="h-3.5 w-3.5" /> Built for Pakistan
        </span>
        <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] sm:text-5xl">
          Eat, train, and track —{" "}
          <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
            personalized to you.
          </span>
        </h1>
        <p className="mt-5 max-w-lg text-lg text-ink-soft">
          Desi-first 7-day meal plans, home or gym workouts, and progress tracking —
          grounded in real nutrition science, not guesswork.
        </p>

        <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <f.icon className="h-5 w-5" />
              </span>
              <div className="mt-3 text-sm font-semibold">{f.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-ink-muted">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth card */}
      <div className="animate-scale-in">
        <div className="card mx-auto w-full max-w-md shadow-lift">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m ? "bg-white text-brand-700 shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
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

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">{error}</p>
            )}
            {notice && (
              <p className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 ring-1 ring-brand-100">
                <Check className="h-4 w-4" /> {notice}
              </p>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
              {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
