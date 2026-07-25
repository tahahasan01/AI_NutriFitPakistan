"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Salad, Dumbbell, LineChart, ArrowRight, Sparkles, Flame, CalendarDays } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { BmiCard } from "@/components/BmiCard";
import { CalorieRing } from "@/components/CalorieRing";
import { useAuth } from "../providers";
import { api } from "@/lib/api";
import type { Summary } from "@/lib/types";

const ACTIONS = [
  { href: "/diet", title: "Diet plan", desc: "Generate this week's meals", icon: Salad },
  { href: "/workout", title: "Workout", desc: "Build your training split", icon: Dumbbell },
  { href: "/progress", title: "Progress", desc: "Log weight & see trends", icon: LineChart },
];

function TodayCard() {
  const [s, setS] = useState<Summary | null>(null);
  useEffect(() => { api.get<Summary>("/api/log/summary").then(setS).catch(() => {}); }, []);

  const eaten = s?.today.calories ?? 0;
  const target = s?.target?.calories ?? 0;

  return (
    <Link href="/log" className="card card-hover group block">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-brand-600">
          <CalendarDays className="h-5 w-5" /><span className="eyebrow">Today</span>
        </div>
        {s && s.streak > 0 && (
          <span className="badge bg-brand-500/12 text-brand-600"><Flame className="h-3.5 w-3.5" /> {s.streak}-day streak</span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-5">
        {target > 0 ? (
          <CalorieRing eaten={eaten} target={target} size={132} />
        ) : (
          <div className="grid h-[132px] w-[132px] place-items-center rounded-full bg-paper-warm text-center text-xs text-ink-muted">
            Set targets<br />in Diet
          </div>
        )}
        <div className="flex-1 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Logged today</span><span className="font-semibold">{s?.meals_logged_today ?? 0} items</span></div>
          <div className="flex justify-between"><span className="text-ink-muted">Eaten</span><span className="font-semibold">{Math.round(eaten)} kcal</span></div>
          {target > 0 && <div className="flex justify-between"><span className="text-ink-muted">Target</span><span className="font-semibold">{Math.round(target)} kcal</span></div>}
          <div className="flex items-center gap-1 pt-1 font-medium text-brand-600 group-hover:underline">
            Open food diary <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function DashInner() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <span className="eyebrow">Dashboard</span>
        <h1 className="mt-2 text-2xl font-semibold sm:text-5xl">
          Welcome back, <span className="italic">{user?.name?.split(" ")[0] || "athlete"}</span>.
        </h1>
        <p className="mt-2 text-ink-muted">Track today, check your BMI, then jump into your plan.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6 animate-fade-up-1">
          <TodayCard />
          <BmiCard />
        </div>

        <div className="space-y-4 animate-fade-up-2">
          {ACTIONS.map((c) => (
            <Link key={c.href} href={c.href} className="card card-hover group flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-paper-warm text-brand-500 ring-1 ring-brand-500/20">
                <c.icon className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <div className="font-semibold">{c.title}</div>
                <div className="text-sm text-ink-muted">{c.desc}</div>
              </div>
              <ArrowRight className="h-5 w-5 text-ink-faint transition group-hover:translate-x-1 group-hover:text-brand-600" />
            </Link>
          ))}

          <div className="card bg-night text-white">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-ember-400" />
              <div>
                <div className="font-semibold">Tip of the day</div>
                <p className="mt-0.5 text-sm text-white/70">
                  Aim for protein at every meal — it keeps you full and protects muscle while losing fat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <RequireAuth><DashInner /></RequireAuth>;
}
