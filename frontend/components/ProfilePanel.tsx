"use client";

import { useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { ACTIVITIES, GOALS } from "@/lib/types";
import type { ProfileData } from "@/lib/useProfile";

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-paper-warm px-3 py-1.5 text-sm font-medium text-ink-soft ring-1 ring-ink/[.06]">
      {children}
    </span>
  );
}

/**
 * Shows a saved profile as a compact summary + one Generate button. Only when
 * the user taps Edit (or has no profile yet) does the full form appear — so
 * pages stop re-asking for the same details on every visit.
 */
export function ProfilePanel({
  profile, setProfile, exists, loaded, cta, busy, error, onGenerate, children, summaryExtra,
}: {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  exists: boolean;
  loaded: boolean;
  cta: string;
  busy: boolean;
  error?: string | null;
  onGenerate: () => void;
  children?: React.ReactNode;      // extra form fields (edit mode) e.g. equipment
  summaryExtra?: React.ReactNode;  // extra summary chips e.g. equipment
}) {
  const [editing, setEditing] = useState(false);
  const num = (k: keyof ProfileData, v: string) => setProfile((p) => ({ ...p, [k]: Number(v) }));

  if (!loaded) return <div className="card h-32 animate-pulse bg-paper-warm/40" />;

  // Compact summary — the default view once a profile is saved.
  if (exists && !editing) {
    return (
      <div className="card space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="label">Your profile</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Chip>{profile.age} yrs</Chip>
              <Chip>{profile.gender === 1 ? "Female" : "Male"}</Chip>
              <Chip>{profile.weight} kg</Chip>
              <Chip>{profile.height} cm</Chip>
              <Chip>{GOALS[profile.goal] ?? "—"}</Chip>
              <Chip>{ACTIVITIES[profile.activity] ?? "—"}</Chip>
              {summaryExtra}
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="btn-ghost shrink-0 px-3 py-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
        <button onClick={onGenerate} disabled={busy} className="btn-primary w-full py-3.5 text-base">
          <Sparkles className="h-5 w-5" /> {busy ? "Generating…" : cta}
        </button>
        {error && <p className="rounded-lg bg-rose-500/12 px-3 py-2 text-sm text-rose-400">{error}</p>}
      </div>
    );
  }

  // Editable form — first-time setup, or when Edit is tapped.
  return (
    <form onSubmit={(e) => { e.preventDefault(); setEditing(false); onGenerate(); }} className="card space-y-5">
      <div className="label">{exists ? "Edit your details" : "Tell us about you"}</div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
        {children}
      </div>
      <div className="flex gap-3">
        {exists && (
          <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1 py-3">Cancel</button>
        )}
        <button type="submit" disabled={busy} className="btn-primary flex-1 py-3.5 text-base">
          {busy ? "Generating…" : cta}
        </button>
      </div>
      {error && <p className="rounded-lg bg-rose-500/12 px-3 py-2 text-sm text-rose-400">{error}</p>}
    </form>
  );
}
