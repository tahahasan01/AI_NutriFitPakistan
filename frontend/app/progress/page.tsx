"use client";

import { useEffect, useState } from "react";
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import type { ProgressData, WeekKey } from "@/lib/types";

const WEEKS: { key: WeekKey; label: string }[] = [
  { key: "start", label: "Start" },
  { key: "week1", label: "Week 1" },
  { key: "week2", label: "Week 2" },
  { key: "week3", label: "Week 3" },
  { key: "week4", label: "Week 4" },
  { key: "week5", label: "Week 5" },
  { key: "week6", label: "Week 6" },
];

function ProgressInner() {
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [goalMode, setGoalMode] = useState("loss");
  const [data, setData] = useState<ProgressData | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await api.get<ProgressData>("/api/progress/weights");
    setData(res);
    setGoalMode(res.goal_mode || "loss");
    const w: Record<string, string> = {};
    for (const { key } of WEEKS) w[key] = res.weights[key] != null ? String(res.weights[key]) : "";
    setWeights(w);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    const payload: Record<string, number | null> = {};
    for (const { key } of WEEKS) {
      const v = weights[key];
      payload[key] = v === "" || v == null ? null : Number(v);
    }
    try {
      const res = await api.post<ProgressData>("/api/progress/weights", {
        weights: payload,
        goal_mode: goalMode,
      });
      setData(res);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  const chartData = WEEKS.map(({ key, label }) => ({
    name: label,
    weight: weights[key] ? Number(weights[key]) : null,
  })).filter((d) => d.weight != null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Progress tracking</h1>
        <p className="text-slate-600">Log your weekly weight to see trends and plateau alerts.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="card space-y-4">
          <div>
            <label className="label">Goal</label>
            <select className="input" value={goalMode} onChange={(e) => setGoalMode(e.target.value)}>
              <option value="loss">Weight loss</option>
              <option value="gain">Weight gain</option>
              <option value="maintain">Maintain</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {WEEKS.map(({ key, label }) => (
              <div key={key}>
                <label className="label">{label} (kg)</label>
                <input type="number" step="0.1" className="input" value={weights[key] ?? ""}
                  onChange={(e) => setWeights((w) => ({ ...w, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Saving…" : "Save progress"}
          </button>
          {saved && <p className="text-sm text-brand">Saved ✓</p>}
        </form>

        <div className="space-y-4">
          <div className="card h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis domain={["auto", "auto"]} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                Enter weights to see your trend
              </div>
            )}
          </div>

          {data?.plateau && (
            <div className={`card ${data.plateau.detected ? "border-orange-300 bg-orange-50" : ""}`}>
              <div className="font-semibold">
                {data.plateau.detected ? "⚠️ Plateau detected" : "✅ On track"}
              </div>
              <p className="mt-1 text-sm text-slate-600">{data.plateau.reason}</p>
              {data.plateau.net_change_kg != null && (
                <p className="mt-1 text-sm text-slate-500">
                  Net change: {data.plateau.net_change_kg} kg over {data.plateau.weeks_considered} weeks
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <RequireAuth>
      <ProgressInner />
    </RequireAuth>
  );
}
