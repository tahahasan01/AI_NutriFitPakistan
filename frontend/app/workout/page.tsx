"use client";

import { useState } from "react";
import { Dumbbell, RefreshCw, Flame, PlayCircle, TrendingDown } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { ProfilePanel, Chip } from "@/components/ProfilePanel";
import { useProfile } from "@/lib/useProfile";
import { api, ApiError } from "@/lib/api";
import { type Exercise, type WorkoutPlan } from "@/lib/types";

const DIFF_COLOR: Record<string, string> = {
  beginner: "bg-brand-500/12 text-brand-500 ring-brand-500/20",
  intermediate: "bg-ember-500/12 text-ember-500 ring-ember-500/25",
  expert: "bg-rose-500/12 text-rose-400 ring-rose-500/25",
};

function WorkoutInner() {
  const { profile, setProfile, exists, loaded, save } = useProfile();
  const [preference, setPreference] = useState("Gym");
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true); setError(null);
    try {
      const res = await api.post<WorkoutPlan>("/api/workout/generate", { ...profile, preference });
      setPlan(res); setActiveDay(Object.keys(res.plan)[0] ?? null);
      save(profile);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate workout.");
    } finally { setBusy(false); }
  }

  async function swap(day: string, idx: number, ex: Exercise) {
    try {
      const res = await api.post<{ alternatives: Exercise[] }>("/api/workout/swap", { current: ex, preference });
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
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Your 6-day split</h1>
        <p className="text-ink-muted">Tailored to your goal and equipment.</p>
      </header>

      <ProfilePanel
        profile={profile} setProfile={setProfile} exists={exists} loaded={loaded}
        cta="Generate workout plan" busy={busy} error={error} onGenerate={generate}
        summaryExtra={<Chip>{preference}</Chip>}
      >
        <div className="field"><label className="label">Equipment</label>
          <select className="input" value={preference} onChange={(e) => setPreference(e.target.value)}>
            <option value="Gym">Gym</option><option value="Home">Home</option></select></div>
      </ProfilePanel>

      {plan && activeDay && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="card flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-paper-warm text-brand-500"><Flame className="h-6 w-6" /></span>
              <div>
                <div className="text-2xl font-extrabold">{Math.round(plan.total_calories)} <span className="text-sm font-medium text-ink-muted">kcal</span></div>
                <div className="text-sm text-ink-muted">Estimated weekly burn</div>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-paper-warm text-ember-500"><TrendingDown className="h-6 w-6" /></span>
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
