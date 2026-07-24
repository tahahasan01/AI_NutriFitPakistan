"use client";

import Link from "next/link";
import { Salad, Dumbbell, LineChart, ArrowRight, Sparkles } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { BmiCard } from "@/components/BmiCard";
import { useAuth } from "../providers";

const ACTIONS = [
  { href: "/diet", title: "Diet plan", desc: "Generate this week's meals", icon: Salad },
  { href: "/workout", title: "Workout", desc: "Build your training split", icon: Dumbbell },
  { href: "/progress", title: "Progress", desc: "Log weight & see trends", icon: LineChart },
];

function DashInner() {
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <span className="eyebrow">Dashboard</span>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          Welcome back, <span className="italic">{user?.name?.split(" ")[0] || "athlete"}</span>.
        </h1>
        <p className="mt-2 text-ink-muted">Check your BMI, then jump into your plan.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr,1fr]">
        <div className="animate-fade-up-1"><BmiCard /></div>

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
