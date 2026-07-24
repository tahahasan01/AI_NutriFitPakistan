"use client";

import { useState } from "react";
import { Dumbbell, RefreshCw, Flame, PlayCircle, TrendingDown } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { api, ApiError } from "@/lib/api";
import { ACTIVITIES, GOALS, type Exercise, type WorkoutPlan } from "@/lib/types";

const DIFF_COLOR: Record<string, string> = {
  beginner: "bg-brand-50 text-brand-700 ring-brand-100",
  intermediate: "bg-amber-50 text-amber-700 ring-amber-100",
  expert: "bg-rose-50 text-rose-700 ring-rose-100",
};

function WorkoutInner() {
  const [profile, setProfile] = useState({ age: 25, gender: 0, weight: 70, height: 175, goal: 0, activity: 2, preference: "Gym" });
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setProfile((p) => ({ ...p, [k]: k === "preference" ? v : Number(v) }));

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await api.post<WorkoutPlan>("/api/workout/generate", profile);
      setPlan(res); setActiveDay(Object.keys(res.plan)[0] ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate workout.");
    } finally { setBusy(false); }
  }

  async function swap(day: string, idx: number, ex: Exercise) {
    try {
      const res = await api.post<{ alternatives: Exercise[] }>("/api/workout/swap", { current: ex, preference: profile.preference });
      const alt = res.alternatives?.find((a) => a.Exercise_Name !== ex.Exercise_Name);
      if (alt && plan) {
        const copy = structuredClone(plan);
        copy.plan[day][idx] = { ...ex, ...alt };
        setPlan(copy);
      }
    } catch { /* ignore */ }
  }

  const days = plan ? Object.keys(plan.plan) : [];

  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <div className="flex items-center gap-2 text-brand-600">
          <Dumbbell className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Workout plan</span>
        </div>
        <h1 className="mt-1 text-3xl font-extrabold">Your 6-day split</h1>
        <p className="text-ink-muted">Tailored to your goal and equipment.</p>
      </header>

      <form onSubmit={generate} className="card grid gap-4 sm:grid-cols-3 animate-fade-up">
        <div className="field"><label className="label">Age</label>
          <input type="number" className="input" value={profile.age} min={1} max={120} onChange={(e) => set("age", e.target.value)} /></div>
        <div className="field"><label className="label">Weight (kg)</label>
          <input type="number" className="input" value={profile.weight} min={30} max={300} step="0.1" onChange={(e) => set("weight", e.target.value)} /></div>
        <div className="field"><label className="label">Height (cm)</label>
          <input type="number" className="input" value={profile.height} min={100} max={250} onChange={(e) => set("height", e.target.value)} /></div>
        <div className="field"><label className="label">Goal</label>
          <select className="input" value={profile.goal} onChange={(e) => set("goal", e.target.value)}>
            {GOALS.map((g, i) => <option key={g} value={i}>{g}</option>)}</select></div>
        <div className="field"><label className="label">Activity</label>
          <select className="input" value={profile.activity} onChange={(e) => set("activity", e.target.value)}>
            {ACTIVITIES.map((a, i) => <option key={a} value={i}>{a}</option>)}</select></div>
        <div className="field"><label className="label">Equipment</label>
          <select className="input" value={profile.preference} onChange={(e) => set("preference", e.target.value)}>
            <option value="Gym">Gym</option><option value="Home">Home</option></select></div>
        <div className="sm:col-span-3">
          <button className="btn-primary w-full py-3" disabled={busy}>{busy ? "Generating…" : "Generate workout plan"}</button>
          {error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>
      </form>

      {plan && activeDay && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><Flame className="h-6 w-6" /></span>
              <div>
                <div className="text-2xl font-extrabold">{Math.round(plan.total_calories)} <span className="text-sm font-medium text-ink-muted">kcal</span></div>
                <div className="text-sm text-ink-muted">Estimated weekly burn</div>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-saffron-50 text-saffron-400"><TrendingDown className="h-6 w-6" /></span>
              <div>
                <div className="text-sm font-semibold">30-day projection</div>
                <div className="text-sm text-ink-muted">{plan.chart_data.summary}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button key={d} onClick={() => setActiveDay(d)}
                className={`btn-chip ${activeDay === d
                  ? "bg-brand-600 text-paper"
                  : "border border-ink/[.1] bg-paper-card text-ink-muted hover:border-ink/20"}`}>
                {d}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {plan.plan[activeDay].map((ex, i) => {
              const diff = (ex.Difficulty || "").toLowerCase();
              return (
                <div key={i} className="card card-hover">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold leading-tight">{ex.Exercise_Name}</div>
                    <button onClick={() => swap(activeDay, i, ex)} className="btn-ghost px-2.5 py-1.5 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" /> Swap
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="badge bg-paper-warm text-ink-soft">{ex.Primary_Muscle}</span>
                    <span className="badge bg-paper-warm text-ink-soft">{ex.Equipment}</span>
                    <span className={`badge ring-1 ${DIFF_COLOR[diff] || "bg-paper-warm text-ink-soft ring-ink/[.06]"}`}>{ex.Difficulty}</span>
                  </div>
                  {ex.Instructions && <p className="mt-3 line-clamp-2 text-sm text-ink-muted">{ex.Instructions}</p>}
                  <div className="mt-3 flex items-center justify-between border-t border-ink/[.06] pt-3 text-sm">
                    <span className="flex items-center gap-1.5 text-ink-soft"><Flame className="h-4 w-4 text-brand-600" /> ~{ex.calories ?? 0} kcal</span>
                    {ex.Video_URL && (
                      <a href={ex.Video_URL} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700">
                        <PlayCircle className="h-4 w-4" /> Watch demo
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return <RequireAuth><WorkoutInner /></RequireAuth>;
}
