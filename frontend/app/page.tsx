"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Salad, Dumbbell, LineChart, Sparkles, ArrowRight, ArrowDown, Check, Flame,
  ShieldCheck, RefreshCw, MapPin, Utensils, Target, Gauge, ChevronDown, Star, X, Minus,
} from "lucide-react";
import { useAuth } from "./providers";
import { MacroDonut, MacroLegend } from "@/components/MacroDonut";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-2xl font-semibold text-ink sm:text-5xl">{value}</div>
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
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 font-display text-xl font-semibold text-ember-400">
        {n}
      </div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
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

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Logged-in users go straight to their dashboard.
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  if (!loading && user) {
    return <div className="py-20 text-center text-ink-muted">Taking you to your dashboard…</div>;
  }

  return (
    <div className="space-y-28 pb-10">
      {/* ---------- HERO ---------- */}
      <section className="relative grid items-center gap-12 pt-6 lg:grid-cols-[1.15fr,0.85fr] lg:pt-10">
        <div aria-hidden className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-ember-300/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute right-0 top-52 h-72 w-72 rounded-full bg-brand-300/25 blur-3xl" />

        <div className="relative animate-fade-up">
          <span className="badge bg-brand-500/12 text-brand-500 ring-1 ring-brand-500/20">
            <Sparkles className="h-3.5 w-3.5 text-saffron-300" /> AI-assisted nutrition & fitness
          </span>
          <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.05] sm:text-7xl">
            Eat well.<br />Train smart.<br />
            <span className="italic text-flame">Actually</span> stick to it.
          </h1>
          <p className="mt-7 max-w-lg text-base sm:text-lg leading-relaxed text-ink-soft animate-fade-up-1">
            Desi-first 7-day meal plans, home or gym workouts, and progress tracking —
            built on locally accurate, verified food data. Not another calorie calculator.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up-2">
            <Link href="/signup" className="btn-accent px-5 py-3 text-sm sm:px-7 sm:py-3.5 sm:text-base">
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="btn-ghost px-5 py-3 text-sm sm:px-6 sm:py-3.5 sm:text-base">
              How it works <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted animate-fade-up-2">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-500" /> 150+ verified foods</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-500" /> Lab-accurate macros</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-500" /> No credit card</span>
          </div>
        </div>

        {/* Hero image + overlapping preview card */}
        <div className="relative animate-scale-in lg:justify-self-end">
          <div className="overflow-hidden rounded-[1.75rem] shadow-lift ring-1 ring-ink/[.06]">
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=85&w=2400&auto=format&fit=crop"
              alt="Fresh, balanced desi-friendly meals"
              className="h-72 w-full object-cover sm:h-80 lg:h-[430px]"
              loading="eager"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
            <div aria-hidden className="absolute right-4 top-4 rotate-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-brand-600 shadow-soft backdrop-blur">
              Ready in 20s
            </div>
          </div>
          <div className="relative z-10 mx-3 -mt-14 card shadow-lift sm:mx-6">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Your daily target</div>
              <span className="badge bg-brand-500/12 text-brand-500">Weight loss</span>
            </div>
            <div className="mt-4 flex items-center gap-5 border-b border-ink/[.07] pb-5">
              <MacroDonut protein={165} carbs={193} fat={86} centerLabel="2205" centerSub="kcal / day" size={120} />
              <MacroLegend protein={165} carbs={193} fat={86} />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[["2594", "TDEE"], ["165g", "Protein"], ["7-day", "Plan"]].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-paper-warm px-2 py-3">
                  <div className="font-display text-lg font-semibold text-brand-600">{v}</div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- STATS BAND ---------- */}
      <section className="relative overflow-hidden rounded-3xl px-6 py-10 text-white shadow-lift"
        style={{ backgroundImage: "linear-gradient(120deg, #cf2233 0%, #f2542d 45%, #f7a63a 100%)" }}>
        <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ["150+", "Desi & global foods"], ["7-day", "Calorie-matched plans"],
            ["6-day", "Home or gym splits"], ["±6%", "vs USDA references"],
          ].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="font-display text-2xl font-semibold sm:text-5xl">{v}</div>
              <div className="mt-1 text-sm text-white/80">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="space-y-12">
        <div className="max-w-2xl">
          <span className="eyebrow">Everything in one place</span>
          <h2 className="mt-3 text-2xl font-semibold sm:text-5xl">A complete plan,<br />not just a calculator.</h2>
          <p className="mt-4 text-ink-muted">
            Most apps stop at a number. NutriFit turns your goal into meals, workouts, and a feedback loop.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={Target} tint="bg-paper-warm text-brand-500" title="TDEE-based targets"
            desc="Mifflin–St Jeor with correct Atwater macros (protein/carb 4, fat 9 kcal/g)." />
          <Feature icon={Salad} tint="bg-paper-warm text-ember-500" title="Desi-first meals"
            desc="Biryani, daal, karahi, chaat — real Pakistani cuisine, portioned to your target." />
          <Feature icon={RefreshCw} tint="bg-paper-warm text-ember-500" title="Smart swaps"
            desc="Don't like a meal? Swap it for a goal-aware alternative in one tap." />
          <Feature icon={Dumbbell} tint="bg-paper-warm text-brand-500" title="Home & gym workouts"
            desc="6-day splits that match your equipment, with per-exercise calorie burn." />
          <Feature icon={LineChart} tint="bg-paper-warm text-ember-500" title="Progress & plateau"
            desc="Weekly weight tracking with trend charts and automatic plateau alerts." />
          <Feature icon={ShieldCheck} tint="bg-paper-warm text-ember-500" title="Private & secure"
            desc="Hashed passwords, session auth, and your data never leaves your account." />
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      {/* ---------- FOOD GALLERY ---------- */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <span className="eyebrow">Real desi food, real macros</span>
          <h2 className="mt-3 text-2xl font-semibold sm:text-5xl">From biryani to greens.</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { src: "photo-1585937421612-70a008356fbe", label: "Karahi & curries" },
            { src: "photo-1567188040759-fb8a883dc6d8", label: "Balanced thalis" },
            { src: "photo-1546069901-ba9599a7e63c", label: "Fresh & lean" },
            { src: "photo-1571019613454-1cb2f99b2d8b", label: "Home & gym" },
          ].map((g) => (
            <div key={g.label} className="group relative overflow-hidden rounded-2xl shadow-soft ring-1 ring-ink/[.06]">
              <img src={`https://images.unsplash.com/${g.src}?q=85&w=1400&auto=format&fit=crop`}
                alt={g.label} loading="lazy"
                className="h-40 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-56" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-transparent" />
              <span className="absolute bottom-3 left-3 text-sm font-semibold text-white">{g.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="space-y-12">
        <div className="max-w-2xl">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-3 text-2xl font-semibold sm:text-5xl">Three steps to your plan.</h2>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          <Step n={1} title="Tell us about you" desc="Age, weight, height, goal, and activity — takes 20 seconds." />
          <Step n={2} title="Get your plan" desc="A calorie-matched 7-day menu and a 6-day workout split, instantly." />
          <Step n={3} title="Track & adapt" desc="Log your weight, swap meals you dislike, and watch for plateaus." />
        </div>
      </section>

      {/* ---------- SAMPLE PLAN PREVIEW ---------- */}
      <section className="grid items-center gap-12 lg:grid-cols-[0.9fr,1.1fr]">
        <div>
          <span className="eyebrow">See it in action</span>
          <h2 className="mt-3 text-2xl font-semibold sm:text-5xl">Balanced macros,<br />real food.</h2>
          <p className="mt-4 text-ink-soft">
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
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> <span className="text-ink-soft">{t}</span>
              </li>
            ))}
          </ul>
          <Link href="/signup" className="btn-primary mt-8 px-6 py-3">Build my plan <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="card shadow-lift">
          <div className="flex items-center gap-5 border-b border-ink/[.07] pb-5">
            <MacroDonut protein={165} carbs={193} fat={86} centerLabel="2205" centerSub="kcal / day" size={130} />
            <div className="space-y-2">
              <div className="eyebrow">Monday · Weight loss</div>
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
              <div key={m.type} className="flex items-center gap-3 rounded-xl bg-paper-warm px-3 py-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-paper-card text-lg shadow-soft">{m.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{m.type}</div>
                  <div className="truncate text-sm font-semibold">{m.name}</div>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-ink"><Flame className="h-3.5 w-3.5 text-brand-500" />{m.kcal}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- BUILT FOR PAKISTAN ---------- */}
      <section className="relative overflow-hidden rounded-3xl px-8 py-16 text-white shadow-lift">
        <img aria-hidden src="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=85&w=2400&auto=format&fit=crop"
          alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-night/95 via-night/90 to-brand-900/85" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-ember-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <span className="badge bg-ember-400/15 text-ember-300 ring-1 ring-ember-400/20"><MapPin className="h-3.5 w-3.5" /> Built for Pakistan</span>
          <h2 className="mt-4 text-2xl font-semibold sm:text-5xl">Nutrition data that fits your plate.</h2>
          <p className="mt-4 text-white/65">
            Generic apps guess at desi portions. We built a verified, per-100g dataset of Pakistani foods —
            so your biryani, nihari, and daal are counted correctly.
          </p>
        </div>
        <div className="relative mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-3">
          {[
            { icon: Utensils, title: "Local cuisine", desc: "Desi mains, chaats, and sweets — not just Western foods." },
            { icon: Gauge, title: "Verified accuracy", desc: "Cross-checked against USDA/standard references." },
            { icon: Star, title: "Goal-aware", desc: "Loss, gain, or maintain — macros shift to match." },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-ember-400/15 text-ember-300"><f.icon className="h-5 w-5" /></span>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-white/65">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- WHY NUTRIFIT (comparison) ---------- */}
      <section className="space-y-8">
        <div className="max-w-2xl">
          <span className="eyebrow">Why NutriFit</span>
          <h2 className="mt-3 text-2xl font-semibold sm:text-5xl">Built for your plate, not the West's.</h2>
          <p className="mt-4 text-base text-ink-muted sm:text-lg">
            Most trackers assume Western diets and guess at desi portions. NutriFit is local-first, by design.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-ink/[.07] bg-paper-card shadow-soft">
          <div className="grid grid-cols-[1.5fr,1fr,1fr] gap-2 bg-paper-warm px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-ink-muted sm:px-6">
            <span className="text-left">Feature</span><span>Generic apps</span><span className="text-brand-600">NutriFit</span>
          </div>
          {[
            ["Verified Pakistani food data", false],
            ["Realistic desi portions", false],
            ["Home & gym workout plans", "some"],
            ["Plateau detection & adaptation", "some"],
            ["Correct macros (fat = 9 kcal/g)", "some"],
            ["Free to start, no ads", "some"],
          ].map(([label, generic]) => (
            <div key={label as string}
              className="grid grid-cols-[1.5fr,1fr,1fr] items-center gap-2 border-t border-ink/[.06] px-4 py-3.5 text-sm sm:px-6">
              <span className="font-medium">{label}</span>
              <span className="flex items-center justify-center text-ink-faint">
                {generic === false ? <X className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
              </span>
              <span className="flex items-center justify-center">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500/12 text-brand-600"><Check className="h-4 w-4" /></span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-3xl space-y-8">
        <div>
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-3 text-2xl font-semibold sm:text-5xl">Questions, answered.</h2>
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
      <section className="rounded-3xl border border-ink/[.07] bg-paper-card px-8 py-16 text-center shadow-soft">
        <h2 className="text-3xl font-semibold sm:text-6xl">Start your plan <span className="italic text-flame">today</span>.</h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-muted">
          Join in under a minute and get a personalized 7-day meal plan and workout split.
        </p>
        <Link href="/signup" className="btn-accent mx-auto mt-9 w-fit px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-base">Create free account <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  );
}
