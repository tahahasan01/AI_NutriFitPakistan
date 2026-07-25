"use client";

import { useState } from "react";
import { Scale } from "lucide-react";

const SEGMENTS = [
  { label: "Underweight", w: 14, color: "#e8a317" }, // 15–18.5
  { label: "Normal", w: 26, color: "#4f9066" },      // 18.5–25
  { label: "Overweight", w: 20, color: "#e0a54a" },  // 25–30
  { label: "Obese", w: 40, color: "#e0577b" },       // 30–40
];

function categorize(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", cls: "text-ember-500 bg-ember-500/12 ring-saffron-100" };
  if (bmi < 25) return { label: "Normal weight", cls: "text-brand-500 bg-brand-500/12 ring-brand-100" };
  if (bmi < 30) return { label: "Overweight", cls: "text-ember-500 bg-ember-500/12 ring-saffron-100" };
  return { label: "Obese", cls: "text-rose-400 bg-rose-500/12 ring-rose-500/20" };
}

export function BmiCard() {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);

  const bmi = height > 0 ? weight / (height / 100) ** 2 : 0;
  const cat = categorize(bmi);
  // marker position across a 15–40 BMI scale
  const pct = Math.min(100, Math.max(0, ((bmi - 15) / (40 - 15)) * 100));
  // healthy weight range for this height
  const lo = 18.5 * (height / 100) ** 2;
  const hi = 24.9 * (height / 100) ** 2;

  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-paper-warm text-brand-500"><Scale className="h-5 w-5" /></span>
        <h2 className="text-lg font-semibold">BMI calculator</h2>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="field">
          <label className="label">Weight (kg)</label>
          <input type="number" min={20} max={300} step="0.1" className="input" value={weight}
            onChange={(e) => setWeight(Number(e.target.value))} />
        </div>
        <div className="field">
          <label className="label">Height (cm)</label>
          <input type="number" min={100} max={250} className="input" value={height}
            onChange={(e) => setHeight(Number(e.target.value))} />
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="font-display text-4xl font-semibold leading-none sm:text-5xl">{bmi ? bmi.toFixed(1) : "—"}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-ink-muted">Body Mass Index</div>
        </div>
        <span className={`badge ring-1 ${cat.cls}`}>{cat.label}</span>
      </div>

      {/* Gauge */}
      <div className="relative mt-5">
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {SEGMENTS.map((s) => (
            <div key={s.label} style={{ width: `${s.w}%`, background: s.color }} />
          ))}
        </div>
        <div className="absolute -top-1 h-4.5 w-1 -translate-x-1/2 rounded-full ring-2 ring-paper-card"
          style={{ left: `${pct}%`, height: 18, background: "#1B1A15" }} />
        <div className="mt-2 flex justify-between text-[10px] text-ink-faint">
          <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        Healthy range for your height: <span className="font-semibold text-ink">{lo.toFixed(0)}–{hi.toFixed(0)} kg</span>.
      </p>
    </div>
  );
}
