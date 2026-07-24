"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { api, ApiError } from "@/lib/api";
import { ACTIVITIES, GOALS, type DietPlan, type Meal } from "@/lib/types";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-bold text-brand">{Math.round(value)}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label} <span className="lowercase">{unit}</span>
      </div>
    </div>
  );
}

function DietInner() {
  const [profile, setProfile] = useState({
    age: 25, gender: 0, weight: 70, height: 175, goal: 0, activity: 2,
  });
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapping, setSwapping] = useState<string | null>(null);

  function num(k: string, v: string) {
    setProfile((p) => ({ ...p, [k]: Number(v) }));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<DietPlan>("/api/diet/generate", { ...profile, allergies: [] });
      setPlan(res);
      setActiveDay(0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate plan.");
    } finally {
      setBusy(false);
    }
  }

  async function swap(dayIdx: number, mealIdx: number, meal: Meal) {
    const mealType = MEAL_TYPES[mealIdx] || "Snack";
    setSwapping(`${dayIdx}-${mealIdx}`);
    try {
      const res = await api.post<{ alternatives: Meal[] }>("/api/diet/swap", {
        current_meal_name: meal.name,
        goal: profile.goal,
        meal_type: mealType,
        target_calories: meal.calories,
      });
      const alt = res.alternatives?.[0];
      if (alt && plan) {
        const copy = structuredClone(plan);
        copy.weekly_plan[dayIdx].meals[mealIdx] = alt;
        setPlan(copy);
      }
    } catch {
      /* no alternative — leave as is */
    } finally {
      setSwapping(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Your diet plan</h1>
        <p className="text-slate-600">Enter your details to generate a 7-day meal plan.</p>
      </div>

      <form onSubmit={generate} className="card grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Age</label>
          <input type="number" className="input" value={profile.age}
            min={1} max={120} onChange={(e) => num("age", e.target.value)} />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input" value={profile.gender} onChange={(e) => num("gender", e.target.value)}>
            <option value={0}>Male</option>
            <option value={1}>Female</option>
          </select>
        </div>
        <div>
          <label className="label">Weight (kg)</label>
          <input type="number" className="input" value={profile.weight}
            min={30} max={300} step="0.1" onChange={(e) => num("weight", e.target.value)} />
        </div>
        <div>
          <label className="label">Height (cm)</label>
          <input type="number" className="input" value={profile.height}
            min={100} max={250} onChange={(e) => num("height", e.target.value)} />
        </div>
        <div>
          <label className="label">Goal</label>
          <select className="input" value={profile.goal} onChange={(e) => num("goal", e.target.value)}>
            {GOALS.map((g, i) => <option key={g} value={i}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Activity</label>
          <select className="input" value={profile.activity} onChange={(e) => num("activity", e.target.value)}>
            {ACTIVITIES.map((a, i) => <option key={a} value={i}>{a}</option>)}
          </select>
        </div>
        <div className="sm:col-span-3">
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Generating…" : "Generate meal plan"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </form>

      {plan && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Target" value={plan.targets.calories} unit="kcal" />
            <StatCard label="Protein" value={plan.targets.protein} unit="g" />
            <StatCard label="Carbs" value={plan.targets.carbs} unit="g" />
            <StatCard label="Fat" value={plan.targets.fat} unit="g" />
          </div>
          <p className="text-sm text-slate-500">
            TDEE ≈ <strong>{Math.round(plan.tdee)}</strong> kcal/day · weekly totals:{" "}
            {Math.round(plan.totals.calories)} kcal
          </p>

          <div className="flex flex-wrap gap-2">
            {plan.weekly_plan.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  activeDay === i ? "bg-brand text-white" : "bg-white border border-slate-200 text-slate-600"
                }`}>
                {d.day || `Day ${i + 1}`}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {plan.weekly_plan[activeDay].meals.map((m, mi) => (
              <div key={mi} className="card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase text-brand">
                      {MEAL_TYPES[mi] || "Extra"}
                    </div>
                    <div className="font-medium">{m.name}</div>
                  </div>
                  <button
                    onClick={() => swap(activeDay, mi, m)}
                    disabled={swapping === `${activeDay}-${mi}`}
                    className="btn-ghost py-1 text-xs"
                  >
                    {swapping === `${activeDay}-${mi}` ? "…" : "Swap"}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <div><div className="font-semibold">{Math.round(m.calories)}</div><div className="text-slate-400">kcal</div></div>
                  <div><div className="font-semibold">{Math.round(m.protein)}</div><div className="text-slate-400">P</div></div>
                  <div><div className="font-semibold">{Math.round(m.carbs)}</div><div className="text-slate-400">C</div></div>
                  <div><div className="font-semibold">{Math.round(m.fat)}</div><div className="text-slate-400">F</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DietPage() {
  return (
    <RequireAuth>
      <DietInner />
    </RequireAuth>
  );
}
