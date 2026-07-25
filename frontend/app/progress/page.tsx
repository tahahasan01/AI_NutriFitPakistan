"use client";

import { useEffect, useState } from "react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { LineChart as LineIcon, Save, CheckCircle2, AlertTriangle, Scale } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import type { ProgressData, WeekKey } from "@/lib/types";

const WEEKS: { key: WeekKey; label: string }[] = [
  { key: "start", label: "Start" },
  { key: "week1", label: "Week 1" }, { key: "week2", label: "Week 2" },
  { key: "week3", label: "Week 3" }, { key: "week4", label: "Week 4" },
  { key: "week5", label: "Week 5" }, { key: "week6", label: "Week 6" },
];

function ProgressInner() {
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [goalMode, setGoalMode] = useState("loss");
  const [data, setData] = useState<ProgressData | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await api.get<ProgressData>("/api/progress/weights");
    setData(res); setGoalMode(res.goal_mode || "loss");
    const w: Record<string, string> = {};
    for (const { key } of WEEKS) w[key] = res.weights[key] != null ? String(res.weights[key]) : "";
    setWeights(w);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setSaved(false);
    const payload: Record<string, number | null> = {};
    for (const { key } of WEEKS) { const v = weights[key]; payload[key] = v === "" || v == null ? null : Number(v); }
    try {
      const res = await api.post<ProgressData>("/api/progress/weights", { weights: payload, goal_mode: goalMode });
      setData(res); setSaved(true);
    } finally { setBusy(false); }
  }

  const chartData = WEEKS.map(({ key, label }) => ({ name: label, weight: weights[key] ? Number(weights[key]) : null }))
    .filter((d) => d.weight != null);
  const current = chartData.length ? chartData[chartData.length - 1].weight! : null;
  const start = chartData.length ? chartData[0].weight! : null;
  const net = current != null && start != null ? current - start : null;
  const plateau = data?.plateau;

  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <div className="flex items-center gap-2 text-brand-600">
          <LineIcon className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Progress</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Track your weight</h1>
        <p className="text-ink-muted">Log weekly to see trends and plateau alerts.</p>
      </header>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up">
        {[
          { label: "Current", val: current != null ? `${current} kg` : "—", icon: Scale, color: "text-brand-500 bg-brand-500/12" },
          { label: "Net change", val: net != null ? `${net > 0 ? "+" : ""}${net.toFixed(1)} kg` : "—", icon: LineIcon, color: (net ?? 0) <= 0 ? "text-brand-500 bg-brand-500/12" : "text-rose-400 bg-rose-500/12" },
          { label: "Weeks logged", val: chartData.length ? `${chartData.length - 1}` : "0", icon: CheckCircle2, color: "text-ember-500 bg-ember-500/12" },
        ].map((s) => (
          <div key={s.label} className="card">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.color}`}><s.icon className="h-5 w-5" /></span>
            <div className="mt-3 text-xl font-extrabold">{s.val}</div>
            <div className="text-[11px] uppercase tracking-wide text-ink-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="card space-y-4 animate-fade-up">
          <div className="field">
            <label className="label">Goal</label>
            <select className="input" value={goalMode} onChange={(e) => setGoalMode(e.target.value)}>
              <option value="loss">Weight loss</option><option value="gain">Weight gain</option><option value="maintain">Maintain</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {WEEKS.map(({ key, label }) => (
              <div key={key} className="field">
                <label className="label">{label}</label>
                <input type="number" step="0.1" className="input" placeholder="kg" value={weights[key] ?? ""}
                  onChange={(e) => setWeights((w) => ({ ...w, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button className="btn-primary w-full py-3" disabled={busy}>
            <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save progress"}
          </button>
          {saved && <p className="flex items-center gap-1.5 text-sm font-medium text-brand-600"><CheckCircle2 className="h-4 w-4" /> Saved</p>}
        </form>

        <div className="space-y-4">
          <div className="card h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wgt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2f6b46" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2f6b46" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,118,110,.22)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} allowDecimals={false} tickLine={false}
                    axisLine={false} width={34} fontSize={12} tickFormatter={(v) => `${Math.round(v)}`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="weight" stroke="#245538" strokeWidth={2.5} fill="url(#wgt)" dot={{ r: 3, fill: "#245538" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-ink-faint">Enter weights to see your trend</div>
            )}
          </div>

          {plateau && (
            <div className={`card flex items-start gap-3 ${plateau.detected ? "ring-1 ring-ember-500/25 bg-ember-500/8" : "ring-1 ring-brand-500/25 bg-brand-500/8"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${plateau.detected ? "bg-ember-500/15 text-ember-500" : "bg-brand-500/15 text-brand-500"}`}>
                {plateau.detected ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </span>
              <div>
                <div className="font-semibold">{plateau.detected ? "Plateau detected" : "On track"}</div>
                <p className="mt-0.5 text-sm text-ink-soft">{plateau.reason}</p>
                {plateau.net_change_kg != null && (
                  <p className="mt-0.5 text-xs text-ink-muted">Net {plateau.net_change_kg} kg over {plateau.weeks_considered} weeks</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return <RequireAuth><ProgressInner /></RequireAuth>;
}
