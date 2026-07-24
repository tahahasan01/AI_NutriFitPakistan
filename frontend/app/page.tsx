"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Salad, Dumbbell, LineChart, Sparkles, ArrowRight, ArrowDown, Check, Flame,
  ShieldCheck, RefreshCw, MapPin, Utensils, Target, Gauge, ChevronDown, Star,
} from "lucide-react";
import { useAuth } from "./providers";
import { AuthCard } from "@/components/AuthCard";
import { MacroDonut, MacroLegend } from "@/components/MacroDonut";

/* ---------------- small building blocks ---------------- */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-extrabold text-ink sm:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-ink-muted">{label}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc, tint }: any) {
  return (
    <div className="card card-hover">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="relative">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-glow">
        {n}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="font-semibold">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-ink-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{a}</p>}
    </div>
  );
}

/* ---------------- page ---------------- */
export default function HomePage() {
  const { user, loading } = useAuth();

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
    <div className="space-y-24 pb-10">
      {/* ---------- HERO ---------- */}
      <section className="relative grid items-center gap-12 pt-6 lg:grid-cols-[1.05fr,0.95fr] lg:pt-12">
        {/* decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-10 top-40 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative animate-fade-up">
          <span className="badge bg-white/70 text-brand-700 ring-1 ring-brand-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AI-assisted nutrition & fitness
          </span>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] sm:text-6xl">
            Eat, train, and track —{" "}
            <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 bg-clip-text text-transparent">
              personalized to you.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Desi-first 7-day meal plans, home or gym workouts, and progress tracking —
            grounded in real nutrition science with locally accurate, verified food data.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#auth" className="btn-primary px-6 py-3 text-base">
              Create free account <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#how" className="btn-ghost px-6 py-3 text-base">
              How it works <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-600" /> 150+ verified foods</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-600" /> Lab-accurate macros</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-600" /> No credit card</span>
          </div>
        </div>

        <div className="relative animate-scale-in lg:justify-self-end">
          <AuthCard />
        </div>
      </section>

      {/* ---------- STATS BAND ---------- */}
      <section className="rounded-3xl border border-slate-200/70 bg-white/70 px-6 py-8 shadow-soft backdrop-blur">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat value="150+" label="Desi & global foods" />
          <Stat value="7-day" label="Calorie-matched plans" />
          <Stat value="6-day" label="Home or gym splits" />
          <Stat value="±6%" label="vs USDA references" />
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="space-y-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">Everything in one place</span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">A complete plan, not just a calculator</h2>
          <p className="mt-3 text-ink-muted">
            Most apps stop at a number. NutriFit turns your goal into meals, workouts, and a feedback loop.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={Target} tint="bg-brand-50 text-brand-600" title="TDEE-based targets"
            desc="Mifflin–St Jeor with correct Atwater macros (protein/carb 4, fat 9 kcal/g)." />
          <Feature icon={Salad} tint="bg-amber-50 text-amber-600" title="Desi-first meals"
            desc="Biryani, daal, karahi, chaat — real Pakistani cuisine, portioned to your target." />
          <Feature icon={RefreshCw} tint="bg-indigo-50 text-indigo-600" title="Smart swaps"
            desc="Don't like a meal? Swap it for a goal-aware alternative in one tap." />
          <Feature icon={Dumbbell} tint="bg-rose-50 text-rose-600" title="Home & gym workouts"
            desc="6-day splits that match your equipment, with per-exercise calorie burn." />
          <Feature icon={LineChart} tint="bg-emerald-50 text-emerald-600" title="Progress & plateau"
            desc="Weekly weight tracking with trend charts and automatic plateau alerts." />
          <Feature icon={ShieldCheck} tint="bg-slate-100 text-ink-soft" title="Private & secure"
            desc="Hashed passwords, session auth, and your data never leaves your account." />
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="space-y-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">How it works</span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Three steps to your plan</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <Step n={1} title="Tell us about you" desc="Age, weight, height, goal, and activity — takes 20 seconds." />
          <Step n={2} title="Get your plan" desc="A calorie-matched 7-day menu and a 6-day workout split, instantly." />
          <Step n={3} title="Track & adapt" desc="Log your weight, swap meals you dislike, and watch for plateaus." />
        </div>
      </section>

      {/* ---------- SAMPLE PLAN PREVIEW ---------- */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">See it in action</span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Balanced macros, real food</h2>
          <p className="mt-3 text-ink-soft">
            Every day is built to hit your calorie and macro targets — using foods you actually eat.
            Here's a sample weight-loss day.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Calorie-matched portions, not random serving sizes",
              "Protein prioritized for satiety and muscle retention",
              "One-tap swaps keep variety across the week",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> <span className="text-ink-soft">{t}</span>
              </li>
            ))}
          </ul>
          <a href="#auth" className="btn-primary mt-8 px-6 py-3">Build my plan <ArrowRight className="h-4 w-4" /></a>
        </div>

        <div className="card shadow-lift">
          <div className="flex items-center gap-5 border-b border-slate-100 pb-5">
            <MacroDonut protein={165} carbs={193} fat={86} centerLabel="2205" centerSub="kcal / day" size={130} />
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wide text-brand-600">Monday · Weight loss</div>
              <MacroLegend protein={165} carbs={193} fat={86} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { icon: "🌅", type: "Breakfast", name: "Boiled Eggs", kcal: 330 },
              { icon: "🍲", type: "Lunch", name: "Chicken Karahi + Roti", kcal: 620 },
              { icon: "🌙", type: "Dinner", name: "Grilled Chicken + Salad", kcal: 540 },
              { icon: "🍎", type: "Snack", name: "Greek Yogurt & Almonds", kcal: 220 },
            ].map((m) => (
              <div key={m.type} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-lg shadow-sm">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{m.type}</div>
                  <div className="truncate text-sm font-semibold">{m.name}</div>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-ink"><Flame className="h-3.5 w-3.5 text-brand-600" />{m.kcal}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- BUILT FOR PAKISTAN ---------- */}
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-12 text-white shadow-lift">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge bg-white/15 text-white ring-1 ring-white/20"><MapPin className="h-3.5 w-3.5" /> Built for Pakistan</span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Nutrition data that actually fits your plate</h2>
          <p className="mt-3 text-brand-50">
            Generic apps guess at desi portions. We built a verified, per-100g dataset of Pakistani foods —
            so your biryani, nihari, and daal are counted correctly.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
          {[
            { icon: Utensils, title: "Local cuisine", desc: "Desi mains, chaats, and sweets — not just Western foods." },
            { icon: Gauge, title: "Verified accuracy", desc: "Cross-checked against USDA/standard references." },
            { icon: Star, title: "Goal-aware", desc: "Loss, gain, or maintain — macros shift to match." },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white/15"><f.icon className="h-5 w-5" /></span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-brand-50">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">FAQ</span>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          <Faq q="Is NutriFit free?" a="Yes — create an account and generate diet and workout plans at no cost. No credit card required." />
          <Faq q="Are the calorie numbers accurate?" a="Targets use the Mifflin–St Jeor equation with correct Atwater factors, and every food is stored per-100g and verified within ~6% of USDA/standard references." />
          <Faq q="Can I do this at home without a gym?" a="Absolutely. Choose 'Home' and you'll get a bodyweight-friendly split; choose 'Gym' for equipment-based training." />
          <Faq q="Does it handle Pakistani food?" a="That's the whole point. The dataset is desi-first — biryani, karahi, daal, chaat, and sweets are all included with correct macros." />
          <Faq q="Is my data private?" a="Passwords are hashed, sessions are signed and HttpOnly, and your logs are tied only to your account." />
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="rounded-3xl border border-slate-200/70 bg-white/80 px-8 py-14 text-center shadow-soft backdrop-blur">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Start your plan today</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">
          Join in under a minute and get a personalized 7-day meal plan and workout split.
        </p>
        <a href="#auth" className="btn-primary mx-auto mt-8 w-fit px-8 py-3.5 text-base">
          Create free account <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}
