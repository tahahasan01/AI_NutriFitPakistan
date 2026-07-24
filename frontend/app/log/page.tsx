"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Search, Plus, Trash2, Flame, X } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { CalorieRing } from "@/components/CalorieRing";
import { api } from "@/lib/api";
import type { DayLog, FoodResult, LoggedMeal, Targets } from "@/lib/types";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const MEAL_ICON: Record<string, string> = { Breakfast: "🌅", Lunch: "🍲", Dinner: "🌙", Snack: "🍎" };

function MacroBar({ label, val, target, color }: { label: string; val: number; target?: number; color: string }) {
  const pct = target ? Math.min(100, (val / target) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-semibold text-ink-soft">{label}</span>
        <span className="text-ink-muted">{Math.round(val)}{target ? ` / ${Math.round(target)}` : ""} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-paper-warm">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function LogInner() {
  const [day, setDay] = useState<DayLog | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [addQty, setAddQty] = useState<Record<string, number>>({});
  const [addType, setAddType] = useState<Record<string, string>>({});

  async function load() {
    const d = await api.get<DayLog>("/api/log/day");
    setDay(d);
  }
  useEffect(() => { load(); }, []);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const r = await api.get<{ results: FoodResult[] }>(`/api/foods/search?q=${encodeURIComponent(query)}&limit=20`);
      setResults(r.results);
    } finally { setSearching(false); }
  }

  async function add(food: FoodResult) {
    const qty = addQty[food.name] ?? 150;
    const mt = addType[food.name] ?? (food.is_snack ? "Snack" : food.meal_type || "Lunch");
    const k = qty / 100;
    await api.post("/api/log/meal", {
      meal_type: mt, food_name: food.name, quantity_g: qty,
      calories: +(food.per100.calories * k).toFixed(1),
      protein: +(food.per100.protein * k).toFixed(1),
      carbs: +(food.per100.carbs * k).toFixed(1),
      fat: +(food.per100.fat * k).toFixed(1),
    });
    await load();
  }

  async function remove(id: number) {
    await api.del(`/api/log/meal/${id}`);
    await load();
  }

  const target: Targets | null = day?.target ?? null;
  const totals = day?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const grouped: Record<string, LoggedMeal[]> = {};
  (day?.meals ?? []).forEach((m) => { (grouped[m.meal_type] ||= []).push(m); });

  return (
    <div className="space-y-8">
      <header className="animate-fade-up">
        <div className="flex items-center gap-2 text-brand-600"><CalendarDays className="h-5 w-5" /><span className="eyebrow">Today</span></div>
        <h1 className="mt-1 text-2xl font-semibold sm:text-4xl">Food diary</h1>
        <p className="text-ink-muted">Log what you eat to track against your target.</p>
      </header>

      {/* Summary */}
      <div className="card animate-fade-up">
        {target ? (
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
            <CalorieRing eaten={totals.calories} target={target.calories} />
            <div className="w-full max-w-md space-y-3">
              <MacroBar label="Protein" val={totals.protein} target={target.protein} color="#8b93f8" />
              <MacroBar label="Carbs" val={totals.carbs} target={target.carbs} color="#f5a524" />
              <MacroBar label="Fat" val={totals.fat} target={target.fat} color="#f43f5e" />
            </div>
          </div>
        ) : (
          <div className="sm:col-span-2 text-center">
            <p className="text-ink-muted">Set your targets by generating a plan first.</p>
            <Link href="/diet" className="btn-primary mt-3">Set my targets</Link>
          </div>
        )}
      </div>

      {/* Add meal */}
      <div className="card animate-fade-up">
        {!showSearch ? (
          <button onClick={() => setShowSearch(true)} className="btn-accent w-full py-3"><Plus className="h-4 w-4" /> Log a meal</button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Add food</h2>
              <button onClick={() => setShowSearch(false)} className="text-ink-muted hover:text-ink"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={search} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input autoFocus className="input pl-9" placeholder="Search foods (e.g. biryani, eggs)…"
                  value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <button className="btn-primary px-4" disabled={searching}>{searching ? "…" : "Search"}</button>
            </form>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {results.map((f) => (
                <div key={f.name} className="rounded-xl border border-ink/[.07] bg-paper-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{f.name}</div>
                      <div className="text-xs text-ink-muted">{f.per100.calories} kcal · {f.per100.protein}P {f.per100.carbs}C {f.per100.fat}F per 100g</div>
                    </div>
                    <button onClick={() => add(f)} className="btn-primary shrink-0 px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> Add</button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="number" min={10} max={2000} className="input w-24 py-1.5 text-sm"
                      value={addQty[f.name] ?? 150} onChange={(e) => setAddQty((s) => ({ ...s, [f.name]: Number(e.target.value) }))} />
                    <span className="text-xs text-ink-muted">g</span>
                    <select className="input w-32 py-1.5 text-sm"
                      value={addType[f.name] ?? (f.is_snack ? "Snack" : f.meal_type || "Lunch")}
                      onChange={(e) => setAddType((s) => ({ ...s, [f.name]: e.target.value }))}>
                      {MEAL_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {!results.length && <p className="py-4 text-center text-sm text-ink-faint">Search to find foods to log.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Logged meals */}
      <div className="space-y-4">
        {MEAL_TYPES.map((mt) => (
          <div key={mt} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-lg">{MEAL_ICON[mt]}</span> {mt}
              </div>
              <span className="text-sm text-ink-muted">
                {Math.round((grouped[mt] ?? []).reduce((s, m) => s + m.calories, 0))} kcal
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {(grouped[mt] ?? []).map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg bg-paper-warm px-3 py-2">
                  <Flame className="h-4 w-4 shrink-0 text-brand-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{m.food_name}</div>
                    <div className="text-xs text-ink-muted">{Math.round(m.calories)} kcal · {Math.round(m.quantity_g)} g</div>
                  </div>
                  <button onClick={() => remove(m.id)} className="text-ink-faint hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {!(grouped[mt] ?? []).length && <p className="text-sm text-ink-faint">Nothing logged yet.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogPage() {
  return <RequireAuth><LogInner /></RequireAuth>;
}
