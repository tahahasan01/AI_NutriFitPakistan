"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Salad, Dumbbell, LineChart, ArrowRight, Sparkles, Flame, Check, TrendingUp, TrendingDown,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { BmiCard } from "@/components/BmiCard";
import { CalorieRing } from "@/components/CalorieRing";
import { motion } from "@/components/motion";
import { useAuth } from "../providers";
import { api } from "@/lib/api";
import type { Summary } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;
const WEIGHT_KEYS = ["start", "week1", "week2", "week3", "week4", "week5", "week6"] as const;
const MACROS = [
  { key: "protein", label: "Protein", color: "#8b93f8" },
  { key: "carbs", label: "Carbs", color: "#2dd4bf" },
  { key: "fat", label: "Fat", color: "#f43f5e" },
] as const;

/* ---------- small pieces ---------- */
function MacroBar({ label, val, target, color }: { label: string; val: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, (val / target) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-ink-soft">{label}</span>
        <span className="text-ink-muted"><span className="font-semibold text-ink">{Math.round(val)}</span> / {Math.round(target)} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper-warm">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: EASE }} />
      </div>
    </div>
  );
}

function CoachAsk() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const PROMPTS = ["Can I eat biryani tonight?", "How much protein left?", "Make me a workout"];
  function go(text: string) {
    const t = text.trim();
    router.push(`/coach${t ? `?ask=${encodeURIComponent(t)}` : ""}`);
  }
  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-400/25 bg-paper-card p-5 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="relative flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-400/15 text-brand-400"><Sparkles className="h-5 w-5" /></span>
        <div>
          <div className="font-display text-base font-semibold leading-tight">Ask your AI coach</div>
          <div className="text-xs text-ink-muted">Log a meal, get a plan, or ask anything</div>
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="relative mt-4 flex items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. I had aloo gosht with 2 roti…"
          className="flex-1 rounded-xl border border-ink/[.12] bg-paper-warm/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400/50" />
        <button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-400 text-night transition hover:bg-brand-300">
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
      <div className="relative mt-3 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button key={p} onClick={() => go(p)}
            className="rounded-full border border-ink/[.1] bg-paper-warm/50 px-3 py-1.5 text-xs text-ink-soft transition hover:border-brand-400/40 hover:text-brand-400">
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function TodayCard({ s }: { s: Summary | null }) {
  const eaten = s?.today.calories ?? 0;
  const target = s?.target?.calories ?? 0;
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Today</span>
        {s && s.streak > 0 && (
          <span className="badge bg-brand-400/15 text-brand-400"><Flame className="h-3.5 w-3.5" /> {s.streak}-day streak</span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-5 border-b border-ink/[.07] pb-5">
        {target > 0 ? <CalorieRing eaten={eaten} target={target} size={128} /> : (
          <Link href="/diet" className="grid h-[128px] w-[128px] place-items-center rounded-full bg-paper-warm text-center text-xs text-ink-muted">Set targets<br />in Diet</Link>
        )}
        <div className="flex-1 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Logged</span><span className="font-semibold">{s?.meals_logged_today ?? 0} items</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Eaten</span><span className="font-semibold">{Math.round(eaten)} kcal</span></div>
          {target > 0 && <div className="flex justify-between"><span className="text-ink-muted">Remaining</span><span className="font-semibold text-brand-400">{Math.max(0, Math.round(target - eaten))} kcal</span></div>}
          <Link href="/log" className="group flex items-center gap-1 pt-1 font-medium text-brand-400">
            Food diary <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
      {/* macro bars */}
      <div className="mt-5 space-y-3.5">
        {MACROS.map((m) => (
          <MacroBar key={m.key} label={m.label} color={m.color}
            val={(s?.today as any)?.[m.key] ?? 0} target={(s?.target as any)?.[m.key] ?? 0} />
        ))}
      </div>
    </div>
  );
}

function WeeklyStrip({ s }: { s: Summary | null }) {
  const days = s?.week ?? [];
  return (
    <div className="card">
      <span className="eyebrow">This week</span>
      <div className="mt-4 flex justify-between gap-1.5">
        {days.map((d) => {
          const logged = d.calories > 0;
          const dow = new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "narrow" });
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className={`grid h-9 w-full place-items-center rounded-lg text-xs font-semibold transition ${logged ? "bg-brand-400 text-night" : "bg-paper-warm text-ink-faint"}`}>
                {logged && <Check className="h-4 w-4" />}
              </div>
              <span className="text-[10px] text-ink-muted">{dow}</span>
            </div>
          );
        })}
        {days.length === 0 && <p className="w-full py-2 text-center text-xs text-ink-faint">Log meals to build your streak.</p>}
      </div>
    </div>
  );
}

function Insight({ s }: { s: Summary | null }) {
  const text = useMemo(() => {
    if (!s) return "Loading your day…";
    if (!s.target) return "Set your profile on the Diet page to unlock personalized targets and insights.";
    const remP = Math.round((s.target.protein || 0) - (s.today.protein || 0));
    const remC = Math.round((s.target.calories || 0) - (s.today.calories || 0));
    if (s.meals_logged_today === 0) return "Nothing logged yet — tell your coach what you ate and I'll track it for you.";
    if (remC < -50) return `You're ${Math.abs(remC)} kcal over target today. A lighter dinner or a short walk keeps you on plan.`;
    if (remP > 30) return `You're ${remP}g of protein short today — a grilled chicken breast covers ~31g of it.`;
    return `Nicely on track — ${Math.max(0, remC)} kcal and ${Math.max(0, remP)}g protein left for today. Keep it up!`;
  }, [s]);
  return (
    <div className="card bg-gradient-to-br from-paper-elevated to-paper-card">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-400/15 text-brand-400"><Sparkles className="h-5 w-5" /></span>
        <div>
          <div className="text-sm font-semibold">Today's insight</div>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
        </div>
      </div>
    </div>
  );
}

function WeightTrend() {
  const [w, setW] = useState<any>(null);
  useEffect(() => { api.get<any>("/api/progress/weights").then(setW).catch(() => {}); }, []);
  const pts = w ? WEIGHT_KEYS.map((k) => w.weights?.[k]).filter((v: any) => v != null) as number[] : [];
  const net = w?.plateau?.net_change_kg;
  if (!w || pts.length < 2) {
    return (
      <Link href="/progress" className="card card-hover group flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper-warm text-brand-400 ring-1 ring-brand-400/20"><LineChart className="h-6 w-6" /></span>
        <div className="flex-1"><div className="font-semibold">Track your weight</div><div className="text-sm text-ink-muted">Log weekly to see your trend & plateaus</div></div>
        <ArrowRight className="h-5 w-5 text-ink-faint transition group-hover:translate-x-1 group-hover:text-brand-400" />
      </Link>
    );
  }
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
  const W = 240, H = 56;
  const coords = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - ((v - min) / range) * (H - 8) - 4]);
  const d = coords.map((c, i) => `${i ? "L" : "M"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  const down = net != null && net < 0;
  return (
    <Link href="/progress" className="card card-hover block">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Weight trend</span>
        {net != null && (
          <span className={`badge ${down ? "bg-brand-400/15 text-brand-400" : "bg-paper-warm text-ink-soft"}`}>
            {down ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            {net > 0 ? "+" : ""}{net.toFixed(1)} kg
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="font-display text-3xl font-bold">{pts[pts.length - 1].toFixed(1)}<span className="text-lg text-ink-muted"> kg</span></div>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-14 flex-1" preserveAspectRatio="none">
          <motion.path d={d} fill="none" stroke="#a3e635" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: EASE }} />
          <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r={3.5} fill="#a3e635" />
        </svg>
      </div>
    </Link>
  );
}

const ACTIONS = [
  { href: "/diet", title: "Diet plan", desc: "Your 7-day meals", icon: Salad },
  { href: "/workout", title: "Workout", desc: "Your training split", icon: Dumbbell },
  { href: "/progress", title: "Progress", desc: "Weight & trends", icon: LineChart },
];

/* ---------- page ---------- */
function DashInner() {
  const { user } = useAuth();
  const [s, setS] = useState<Summary | null>(null);
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => { api.get<Summary>("/api/log/summary").then(setS).catch(() => {}); }, []);
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);
  const name = user?.name?.split(" ")[0] || "athlete";

  return (
    <div className="space-y-6">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <span className="eyebrow">Dashboard</span>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">{greeting}, <span className="text-brand-400">{name}</span>.</h1>
        <p className="mt-2 text-ink-muted">Here's your day at a glance — log, plan, and stay on track.</p>
      </motion.header>

      <CoachAsk />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* left: today + week (spans 2) */}
        <div className="space-y-6 lg:col-span-2">
          <TodayCard s={s} />
          <WeeklyStrip s={s} />
          <div className="grid gap-4 sm:grid-cols-3">
            {ACTIONS.map((c) => (
              <Link key={c.href} href={c.href} className="card card-hover group">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-400/10 text-brand-400"><c.icon className="h-5 w-5" /></span>
                <div className="mt-3 font-semibold">{c.title}</div>
                <div className="text-sm text-ink-muted">{c.desc}</div>
                <ArrowRight className="mt-2 h-4 w-4 text-ink-faint transition group-hover:translate-x-1 group-hover:text-brand-400" />
              </Link>
            ))}
          </div>
        </div>

        {/* right: insight + weight + bmi */}
        <div className="space-y-6">
          <Insight s={s} />
          <WeightTrend />
          <BmiCard />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <RequireAuth><DashInner /></RequireAuth>;
}
