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
import { Counter, FadeInUp, motion, staggerContainer, staggerItem } from "@/components/motion";

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
    <div className="group relative overflow-hidden rounded-2xl border border-ink/[.08] bg-paper-card p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-400/40 hover:shadow-glow">
      {/* hover glow wash */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-400/0 blur-2xl transition-all duration-500 group-hover:bg-brand-400/20" />
      <span className={`relative grid h-11 w-11 place-items-center rounded-xl ${tint} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="relative mt-4 text-lg font-semibold">{title}</h3>
      <p className="relative mt-1 text-sm leading-relaxed text-ink-muted">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-400/10 font-display text-xl font-bold text-brand-400 ring-1 ring-brand-400/25">
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
      <section className="relative grid items-start gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center lg:pt-6">
        {/* Full-bleed athletic background for the first screen (mobile) */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[100dvh] w-screen -translate-x-1/2 -translate-y-24 overflow-hidden lg:hidden">
          <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1600&auto=format&fit=crop"
            alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/68" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
        </div>
        <div className="relative flex min-h-[calc(100dvh-8rem)] flex-col justify-center py-6 animate-fade-up lg:block lg:min-h-0 lg:py-0 lg:pt-4">
          <span className="badge w-fit bg-brand-400/10 text-brand-400 ring-1 ring-brand-400/20">
            <Sparkles className="h-3.5 w-3.5" /> AI-assisted nutrition & fitness
          </span>
          <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.07] sm:text-4xl lg:text-5xl">
            Eat well. Train smart.<br />
            <span className="italic text-flame">Actually</span> stick to it.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted animate-fade-up-1 sm:text-lg">
            Desi-first meal plans, home &amp; gym workouts, and progress tracking — on verified food data.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 animate-fade-up-2">
            <Link href="/signup" className="btn-accent px-5 py-3 text-sm sm:px-7 sm:py-3.5 sm:text-base">
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="btn-ghost px-5 py-3 text-sm sm:px-6 sm:py-3.5 sm:text-base">
              How it works <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted animate-fade-up-2">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-500" /> 150+ verified foods</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-500" /> Lab-accurate macros</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-500" /> No credit card</span>
          </div>
        </div>

        {/* Hero image + overlapping preview card */}
        <div className="relative animate-scale-in lg:justify-self-end">
          <div className="relative overflow-hidden rounded-[1.75rem] shadow-lift ring-1 ring-brand-400/15">
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=85&w=2400&auto=format&fit=crop"
              alt="Athlete training hard"
              className="h-64 w-full object-cover grayscale-[.15] sm:h-80 lg:h-[380px]"
              loading="eager"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0B0A] via-[#0A0B0A]/25 to-transparent" />
            <div aria-hidden className="pointer-events-none absolute -inset-px rounded-[1.75rem] ring-1 ring-inset ring-white/5" />
            <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-40 w-40 bg-gradient-to-bl from-brand-400/25 to-transparent blur-2xl" />
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-brand-400 px-3 py-1.5 text-xs font-bold text-night shadow-glow">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-night" /> Ready in 20s
            </div>
          </div>
          <div className="relative z-10 mx-2 -mt-16 rounded-3xl border border-white/[.08] bg-paper-card/95 p-6 shadow-lift backdrop-blur-xl sm:mx-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Your daily target</div>
              <span className="badge bg-brand-400/15 text-brand-400 ring-1 ring-brand-400/20">Weight loss</span>
            </div>
            <div className="mt-6 flex items-center gap-6 border-b border-white/[.08] pb-6">
              <MacroDonut protein={165} carbs={193} fat={86} centerLabel="2205" centerSub="kcal / day" size={128} />
              <MacroLegend protein={165} carbs={193} fat={86} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[["2594", "TDEE"], ["165g", "Protein"], ["7-day", "Plan"]].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-paper-warm/70 px-2 py-4">
                  <div className="font-display text-xl font-bold text-brand-400">{v}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-muted">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- STATS BAND ---------- */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-paper-warm/60 px-6 py-12 sm:py-14">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative grid grid-cols-2 gap-y-10 gap-x-6 sm:grid-cols-4">
          {[
            { to: 150, prefix: "", suffix: "+", label: "Desi & global foods" },
            { to: 7, prefix: "", suffix: "-day", label: "Calorie-matched plans" },
            { to: 6, prefix: "", suffix: "-day", label: "Home or gym splits" },
            { to: 6, prefix: "±", suffix: "%", label: "vs USDA references" },
          ].map((s, i) => (
            <div key={s.label} className="relative text-center sm:text-left">
              {i > 0 && <span aria-hidden className="absolute -left-3 top-1 hidden h-12 w-px bg-white/10 sm:block" />}
              <Counter to={s.to} prefix={s.prefix} suffix={s.suffix}
                className="block font-display text-4xl font-bold text-brand-400 sm:text-5xl" />
              <div className="mt-2 text-sm text-ink-muted">{s.label}</div>
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
        <motion.div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-8% 0px" }}>
          {[
            { icon: Target, title: "TDEE-based targets", desc: "Mifflin–St Jeor with correct Atwater macros (protein/carb 4, fat 9 kcal/g)." },
            { icon: Salad, title: "Desi-first meals", desc: "Biryani, daal, karahi, chaat — real Pakistani cuisine, portioned to your target." },
            { icon: RefreshCw, title: "Smart swaps", desc: "Don't like a meal? Swap it for a goal-aware alternative in one tap." },
            { icon: Dumbbell, title: "Home & gym workouts", desc: "6-day splits that match your equipment, with per-exercise calorie burn." },
            { icon: LineChart, title: "Progress & plateau", desc: "Weekly weight tracking with trend charts and automatic plateau alerts." },
            { icon: ShieldCheck, title: "Private & secure", desc: "Hashed passwords, session auth, and your data never leaves your account." },
          ].map((f) => (
            <motion.div key={f.title} variants={staggerItem}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}>
              <Feature icon={f.icon} tint="bg-brand-400/10 text-brand-400" title={f.title} desc={f.desc} />
            </motion.div>
          ))}
        </motion.div>
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
            <div key={g.label} className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-300 hover:ring-brand-400/50">
              <img src={`https://images.unsplash.com/${g.src}?q=85&w=1400&auto=format&fit=crop`}
                alt={g.label} loading="lazy"
                className="h-40 w-full object-cover transition duration-500 group-hover:scale-110 sm:h-56" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-sm font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />{g.label}
              </span>
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
