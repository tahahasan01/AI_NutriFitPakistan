"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { api, ApiError } from "@/lib/api";
import { ACTIVITIES, GOALS, type Exercise, type WorkoutPlan } from "@/lib/types";

function WorkoutInner() {
  const [profile, setProfile] = useState({
    age: 25, gender: 0, weight: 70, height: 175, goal: 0, activity: 2, preference: "Gym",
  });
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(k: string, v: string) {
    setProfile((p) => ({ ...p, [k]: k === "preference" ? v : Number(v) }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<WorkoutPlan>("/api/workout/generate", profile);
      setPlan(res);
      setActiveDay(Object.keys(res.plan)[0] ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate workout.");
    } finally {
      setBusy(false);
    }
  }

  async function swap(day: string, idx: number, ex: Exercise) {
    try {
      const res = await api.post<{ alternatives: Exercise[] }>("/api/workout/swap", {
        current: ex,
        preference: profile.preference,
      });
      const alt = res.alternatives?.find((a) => a.Exercise_Name !== ex.Exercise_Name);
      if (alt && plan) {
        const copy = structuredClone(plan);
        copy.plan[day][idx] = { ...ex, ...alt };
        setPlan(copy);
      }
    } catch {
      /* ignore */
    }
  }

  const days = plan ? Object.keys(plan.plan) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Your workout plan</h1>
        <p className="text-slate-600">A 6-day split tailored to your goal and equipment.</p>
      </div>

      <form onSubmit={generate} className="card grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Age</label>
          <input type="number" className="input" value={profile.age} min={1} max={120}
            onChange={(e) => set("age", e.target.value)} />
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input type="number" className="input" value={profile.weight} min={30} max={300}
            step="0.1" onChange={(e) => set("weight", e.target.value)} />
        </div>
        <div>
          <label className="label">Height (cm)</label>
          <input type="number" className="input" value={profile.height} min={100} max={250}
            onChange={(e) => set("height", e.target.value)} />
        </div>
        <div>
          <label className="label">Goal</label>
          <select className="input" value={profile.goal} onChange={(e) => set("goal", e.target.value)}>
            {GOALS.map((g, i) => <option key={g} value={i}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Activity</label>
          <select className="input" value={profile.activity} onChange={(e) => set("activity", e.target.value)}>
            {ACTIVITIES.map((a, i) => <option key={a} value={i}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Equipment</label>
          <select className="input" value={profile.preference} onChange={(e) => set("preference", e.target.value)}>
            <option value="Gym">Gym</option>
            <option value="Home">Home</option>
          </select>
        </div>
        <div className="sm:col-span-3">
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Generating…" : "Generate workout plan"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </form>

      {plan && activeDay && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Estimated total burn: <strong>{Math.round(plan.total_calories)}</strong> kcal ·{" "}
            {plan.chart_data.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button key={d} onClick={() => setActiveDay(d)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  activeDay === d ? "bg-brand text-white" : "bg-white border border-slate-200 text-slate-600"
                }`}>
                {d}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {plan.plan[activeDay].map((ex, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{ex.Exercise_Name}</div>
                    <div className="text-xs text-slate-500">
                      {ex.Primary_Muscle} · {ex.Equipment} · {ex.Difficulty}
                    </div>
                  </div>
                  <button onClick={() => swap(activeDay, i, ex)} className="btn-ghost py-1 text-xs">
                    Swap
                  </button>
                </div>
                {ex.Instructions && (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{ex.Instructions}</p>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>~{ex.calories ?? 0} kcal</span>
                  {ex.Video_URL && (
                    <a href={ex.Video_URL} target="_blank" rel="noreferrer"
                      className="text-brand hover:underline">
                      Watch demo ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <RequireAuth>
      <WorkoutInner />
    </RequireAuth>
  );
}
