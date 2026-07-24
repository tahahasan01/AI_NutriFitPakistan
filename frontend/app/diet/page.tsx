"use client";

import { useEffect, useState } from "react";
import { Salad, RefreshCw, Flame, Utensils, Plus, Check } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { MacroDonut, MacroLegend } from "@/components/MacroDonut";
import { api, ApiError } from "@/lib/api";
import { ACTIVITIES, GOALS, type DietPlan, type Meal, type Profile } from "@/lib/types";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const MEAL_ICON: Record<string, string> = { Breakfast: "🌅", Lunch: "🍲", Dinner: "🌙", Snack: "🍎" };

function MacroBar({ label, value, color, max }: { label: string; value: number; color: string; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-[11px] font-semibold text-ink-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-warm">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-[11px] font-semibold text-ink">{Math.round(value)}</span>
    </div>
  );
}

function DietInner() {
  const [profile, setProfile] = useState({ age: 25, gender: 0, weight: 70, height: 175, goal: 0, activity: 2 });
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapping, setSwapping] = useState<string | null>(null);
  const [logged, setLogged] = useState<string | null>(null);

  // Prefill from a saved profile if one exists.
  useEffect(() => {
    api.get<Profile>("/api/profile").then((p) => {
      if (p.exists) setProfile({
        age: p.age!, gender: p.gender!, weight: p.weight!, height: p.height!, goal: p.goal!, activity: p.activity!,
      });
    }).catch(() => {});
  }, []);

  const num = (k: string, v: string) => setProfile((p) => ({ ...p, [k]: Number(v) }));

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await api.post<DietPlan>("/api/diet/generate", { ...profile, allergies: [] });
      setPlan(res); setActiveDay(0);
      // Persist the profile so targets power the dashboard + food diary.
      api.put("/api/profile", profile).catch(() => {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate plan.");
    } finally { setBusy(false); }
  }

  async function logMeal(mealIdx: number, meal: Meal) {
    const mealType = MEAL_TYPES[mealIdx] || "Snack";
    setLogged(`${activeDay}-${mealIdx}`);
    try {
      await api.post("/api/log/meal", {
        meal_type: mealType, food_name: meal.name, quantity_g: meal.quantity,
        calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat,
      });
      setTimeout(() => setLogged(null), 1500);
    } catch { setLogged(null); }
  }

  async function swap(dayIdx: number, mealIdx: number, meal: Meal) {
    const mealType = MEAL_TYPES[mealIdx] || "Snack";
    setSwapping(`${dayIdx}-${mealIdx}`);
    try {
      const res = await api.post<{ alternatives: Meal[] }>("/api/diet/swap", {
        current_meal_name: meal.name, goal: profile.goal, meal_type: mealType, target_calories: meal.calories,
      });
      // record the dislike as implicit feedback (training signal)
      api.post("/api/log/feedback", { food_name: meal.name, meal_type: mealType, signal: "swap_out" }).catch(() => {});
      const alt = res.alternatives?.[0];
      if (alt && plan) {
        const copy = structuredClone(plan);
        copy.weekly_plan[dayIdx].meals[mealIdx] = alt;
        setPlan(copy);
      }
    } catch { /* no alt */ } finally { setSwapping(null); }
  }

  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <div className="flex items-center gap-2 text-brand-600">
          <Salad className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Diet plan</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Your 7-day meal plan</h1>
        <p className="text-ink-muted">Enter your details and we’ll build calorie-matched meals.</p>
      </header>

      <form onSubmit={generate} className="card grid gap-4 sm:grid-cols-3 animate-fade-up">
        <div className="field"><label className="label">Age</label>
          <input type="number" className="input" value={profile.age} min={1} max={120} onChange={(e) => num("age", e.target.value)} /></div>
        <div className="field"><label className="label">Gender</label>
          <select className="input" value={profile.gender} onChange={(e) => num("gender", e.target.value)}>
            <option value={0}>Male</option><option value={1}>Female</option></select></div>
        <div className="field"><label className="label">Weight (kg)</label>
          <input type="number" className="input" value={profile.weight} min={30} max={300} step="0.1" onChange={(e) => num("weight", e.target.value)} /></div>
        <div className="field"><label className="label">Height (cm)</label>
          <input type="number" className="input" value={profile.height} min={100} max={250} onChange={(e) => num("height", e.target.value)} /></div>
        <div className="field"><label className="label">Goal</label>
          <select className="input" value={profile.goal} onChange={(e) => num("goal", e.target.value)}>
            {GOALS.map((g, i) => <option key={g} value={i}>{g}</option>)}</select></div>
        <div className="field"><label className="label">Activity</label>
          <select className="input" value={profile.activity} onChange={(e) => num("activity", e.target.value)}>
            {ACTIVITIES.map((a, i) => <option key={a} value={i}>{a}</option>)}</select></div>
        <div className="sm:col-span-3">
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy ? "Generating…" : "Generate meal plan"}
          </button>
          {error && <p className="mt-2 rounded-lg bg-rose-500/12 px-3 py-2 text-sm text-rose-400">{error}</p>}
        </div>
      </form>

      {plan && (
        <div className="space-y-6 animate-fade-up">
          {/* Summary */}
          <div className="card grid items-center gap-6 sm:grid-cols-[auto,1fr]">
            <div className="flex items-center gap-5">
              <MacroDonut protein={plan.targets.protein} carbs={plan.targets.carbs} fat={plan.targets.fat}
                centerLabel={`${Math.round(plan.targets.calories)}`} centerSub="kcal / day" />
              <div className="space-y-3">
                <MacroLegend protein={plan.targets.protein} carbs={plan.targets.carbs} fat={plan.targets.fat} />
                <div className="text-sm text-ink-muted">
                  TDEE ≈ <span className="font-semibold text-ink">{Math.round(plan.tdee)}</span> kcal ·
                  goal target <span className="font-semibold text-ink">{Math.round(plan.targets.calories)}</span> kcal
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Calories", val: plan.targets.calories, unit: "kcal", color: "text-brand-600" },
                { label: "Protein", val: plan.targets.protein, unit: "g", color: "text-macro-protein" },
                { label: "Carbs", val: plan.targets.carbs, unit: "g", color: "text-macro-carbs" },
                { label: "Fat", val: plan.targets.fat, unit: "g", color: "text-macro-fat" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-paper-warm p-3 text-center ring-1 ring-ink/[.06]">
                  <div className={`text-xl font-extrabold ${s.color}`}>{Math.round(s.val)}</div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">{s.label} · {s.unit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Day pills */}
          <div className="flex flex-wrap gap-2">
            {plan.weekly_plan.map((d, i) => (
              <button key={i} onClick={() => setActiveDay(i)}
                className={`btn-chip ${activeDay === i
                  ? "bg-brand-600 text-paper"
                  : "border border-ink/[.1] bg-paper-card text-ink-muted hover:border-ink/20"}`}>
                {d.day || `Day ${i + 1}`}
              </button>
            ))}
          </div>

          {/* Meals */}
          <div className="grid gap-4 md:grid-cols-2">
            {plan.weekly_plan[activeDay].meals.map((m, mi) => {
              const maxMacro = Math.max(m.protein, m.carbs, m.fat, 1);
              return (
                <div key={mi} className="card card-hover">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper-warm text-lg">
                        {MEAL_ICON[MEAL_TYPES[mi]] || "🍽️"}
                      </span>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                          {MEAL_TYPES[mi] || "Extra"}
                        </div>
                        <div className="font-semibold leading-tight">{m.name}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => logMeal(mi, m)} disabled={logged === `${activeDay}-${mi}`}
                        className={`px-2.5 py-1.5 text-xs ${logged === `${activeDay}-${mi}` ? "btn bg-brand-500/15 text-brand-600" : "btn-primary"}`}>
                        {logged === `${activeDay}-${mi}` ? <><Check className="h-3.5 w-3.5" /> Added</> : <><Plus className="h-3.5 w-3.5" /> Log</>}
                      </button>
                      <button onClick={() => swap(activeDay, mi, m)} disabled={swapping === `${activeDay}-${mi}`}
                        className="btn-ghost px-2.5 py-1.5 text-xs">
                        <RefreshCw className={`h-3.5 w-3.5 ${swapping === `${activeDay}-${mi}` ? "animate-spin" : ""}`} />
                        Swap
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <Flame className="h-4 w-4 text-brand-600" />
                    <span className="font-bold">{Math.round(m.calories)}</span>
                    <span className="text-ink-muted">kcal</span>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <MacroBar label="P" value={m.protein} color="#5b6ee1" max={maxMacro} />
                    <MacroBar label="C" value={m.carbs} color="#e8a317" max={maxMacro} />
                    <MacroBar label="F" value={m.fat} color="#e0577b" max={maxMacro} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!plan && !busy && (
        <div className="card grid place-items-center py-16 text-center text-ink-muted">
          <Utensils className="h-10 w-10 text-ink-faint" />
          <p className="mt-3">Fill in your details above to generate your plan.</p>
        </div>
      )}
    </div>
  );
}

export default function DietPage() {
  return <RequireAuth><DietInner /></RequireAuth>;
}
