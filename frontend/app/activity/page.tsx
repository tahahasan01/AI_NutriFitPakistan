"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Footprints, Bike, Zap, Play, Pause, Square, Flame, Timer, Gauge,
  Navigation, Trash2, Satellite, Route as RouteIcon,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { RequireAuth } from "@/components/RequireAuth";
import { motion } from "@/components/motion";
import { api } from "@/lib/api";

type Kind = "walk" | "run" | "ride";
type Pt = [number, number]; // [lat, lng]

type Activity = {
  id: number;
  kind: Kind;
  kind_label: string;
  distance_km: number;
  duration_s: number;
  calories: number;
  pace_min_km: number;
  route: Pt[];
  date: string;
  created_at: string | null;
};

const KINDS: { key: Kind; label: string; icon: typeof Footprints; met: number; accent: string }[] = [
  { key: "walk", label: "Walk", icon: Footprints, met: 3.8, accent: "#2dd4bf" },
  { key: "run", label: "Run", icon: Zap, met: 9.8, accent: "#8b93f8" },
  { key: "ride", label: "Ride", icon: Bike, met: 7.5, accent: "#f59e0b" },
];

const KIND_ICON: Record<Kind, typeof Footprints> = { walk: Footprints, run: Zap, ride: Bike };

// Haversine distance in metres between two [lat,lng] points.
function metresBetween(a: Pt, b: Pt): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtDur(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

function fmtPace(minPerKm: number): string {
  if (!minPerKm || !isFinite(minPerKm)) return "—";
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** SVG polyline of a GPS route, north-up, aspect-preserved. */
function RouteTrace({ points, accent, className, animate }: {
  points: Pt[]; accent: string; className?: string; animate?: boolean;
}) {
  if (!points || points.length < 2) {
    return (
      <div className={`grid place-items-center rounded-xl border border-ink/10 bg-paper-warm text-ink-faint ${className || ""}`}>
        <div className="flex flex-col items-center gap-1.5 text-xs">
          <Navigation className="h-5 w-5" />
          <span>Route appears as you move</span>
        </div>
      </div>
    );
  }
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const W = 100, H = 100, pad = 10;
  const span = Math.max(maxLat - minLat, maxLng - minLng) || 1e-6;
  const cx = (minLng + maxLng) / 2, cy = (minLat + maxLat) / 2;
  const xy = (la: number, ln: number): [number, number] => [
    W / 2 + ((ln - cx) / span) * (W - 2 * pad),
    H / 2 - ((la - cy) / span) * (H - 2 * pad), // invert: north up
  ];
  const d = points.map((p, i) => {
    const [x, y] = xy(p[0], p[1]);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const [sx, sy] = xy(points[0][0], points[0][1]);
  const [ex, ey] = xy(points[points.length - 1][0], points[points.length - 1][1]);
  return (
    <div className={`relative overflow-hidden rounded-xl border border-ink/10 bg-paper-warm ${className || ""}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="rt-grid" width="12.5" height="12.5" patternUnits="userSpaceOnUse">
            <path d="M12.5 0 L0 0 0 12.5" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-ink/[.06]" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#rt-grid)" />
        <motion.path
          d={d} fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : false}
          animate={animate ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          style={{ filter: `drop-shadow(0 0 3px ${accent}80)` }}
        />
        <circle cx={sx} cy={sy} r="3" fill="#22c55e" stroke="white" strokeWidth="1" />
        <circle cx={ex} cy={ey} r="3" fill={accent} stroke="white" strokeWidth="1" />
      </svg>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit, accent }: {
  icon: typeof Timer; label: string; value: string; unit?: string; accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink/[.08] bg-paper-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
        <Icon className="h-3.5 w-3.5" style={accent ? { color: accent } : undefined} />
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tabular-nums sm:text-3xl">{value}</span>
        {unit && <span className="text-sm font-medium text-ink-muted">{unit}</span>}
      </div>
    </div>
  );
}

function ActivityInner() {
  const [kind, setKind] = useState<Kind>("run");
  const [tracking, setTracking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [points, setPoints] = useState<Pt[]>([]);
  const [distanceM, setDistanceM] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [calories, setCalories] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feed, setFeed] = useState<Activity[]>([]);
  const [weight, setWeight] = useState(70);

  const watchId = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPt = useRef<Pt | null>(null);
  const pausedRef = useRef(false);
  const kindRef = useRef<Kind>("run");
  const weightRef = useRef(70);
  const distRef = useRef(0);

  const accent = KINDS.find((k) => k.key === kind)!.accent;

  const loadFeed = useCallback(async () => {
    try {
      const res = await api.get<{ activities: Activity[] }>("/api/activity");
      setFeed(res.activities);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadFeed();
    api.get<{ exists: boolean; weight?: number }>("/api/profile")
      .then((p) => { if (p.exists && p.weight) { setWeight(p.weight); weightRef.current = p.weight; } })
      .catch(() => {});
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      if (timer.current) clearInterval(timer.current);
    };
  }, [loadFeed]);

  const onPos = useCallback((pos: GeolocationPosition) => {
    if (pausedRef.current) return;
    const { latitude, longitude, accuracy: acc } = pos.coords;
    setAccuracy(acc);
    const pt: Pt = [latitude, longitude];
    if (lastPt.current) {
      const step = metresBetween(lastPt.current, pt);
      // Reject GPS noise (< 1.5m jitter) and impossible jumps (> 80m/tick).
      if (step < 1.5 || step > 80) { if (step >= 1.5) lastPt.current = pt; return; }
      distRef.current += step;
      setDistanceM(distRef.current);
    }
    lastPt.current = pt;
    setPoints((prev) => [...prev, pt]);
  }, []);

  const onErr = useCallback((err: GeolocationPositionError) => {
    setGpsError(
      err.code === err.PERMISSION_DENIED
        ? "Location permission denied. Enable it in your browser to track."
        : "Waiting for GPS signal…"
    );
  }, []);

  function start() {
    if (!("geolocation" in navigator)) {
      setGpsError("Geolocation isn't supported on this device/browser.");
      return;
    }
    setPoints([]); setDistanceM(0); setElapsed(0); setCalories(0);
    setAccuracy(null); setGpsError(null);
    lastPt.current = null; distRef.current = 0;
    pausedRef.current = false; kindRef.current = kind;
    setPaused(false); setTracking(true);

    watchId.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true, maximumAge: 1000, timeout: 20000,
    });
    timer.current = setInterval(() => {
      if (pausedRef.current) return;
      setElapsed((e) => {
        const next = e + 1;
        const met = KINDS.find((k) => k.key === kindRef.current)!.met;
        setCalories((met * weightRef.current * next) / 3600);
        return next;
      });
    }, 1000);
  }

  function togglePause() {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    lastPt.current = null; // avoid a fake jump when resuming
  }

  async function finish() {
    if (watchId.current != null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; }
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setTracking(false); setPaused(false); pausedRef.current = false;

    const distanceKm = distRef.current / 1000;
    if (distanceKm >= 0.02 || elapsed >= 10) {
      setSaving(true);
      try {
        await api.post("/api/activity", {
          kind, distance_km: Number(distanceKm.toFixed(3)),
          duration_s: elapsed, calories: Math.round(calories),
          route: points,
        });
        await loadFeed();
      } catch { /* ignore */ }
      finally { setSaving(false); }
    }
    setPoints([]); setDistanceM(0); setElapsed(0); setCalories(0); setAccuracy(null);
  }

  async function remove(id: number) {
    setFeed((f) => f.filter((a) => a.id !== id));
    try { await api.del(`/api/activity/${id}`); } catch { loadFeed(); }
  }

  const distanceKm = distanceM / 1000;
  const livePace = distanceKm > 0.05 ? elapsed / 60 / distanceKm : 0;
  const gpsQuality = accuracy == null ? null : accuracy <= 12 ? "strong" : accuracy <= 30 ? "ok" : "weak";

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-brand-400">
          <Navigation className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Live tracking</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Track a workout</h1>
        <p className="text-ink-muted">GPS-tracked walks, runs & rides — live distance, pace and calories, saved to your log.</p>
      </header>

      {/* Kind picker */}
      <div className="grid grid-cols-3 gap-3">
        {KINDS.map((k) => {
          const Icon = k.icon;
          const active = kind === k.key;
          return (
            <button key={k.key} onClick={() => !tracking && setKind(k.key)} disabled={tracking}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 transition disabled:opacity-60 ${
                active ? "border-transparent text-night" : "border-ink/[.1] bg-paper-card text-ink-muted hover:border-ink/25"}`}
              style={active ? { background: k.accent } : undefined}>
              <Icon className="h-6 w-6" />
              <span className="text-sm font-bold">{k.label}</span>
            </button>
          );
        })}
      </div>

      {/* Live console */}
      <div className="card space-y-5" style={{ borderColor: tracking ? `${accent}55` : undefined }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${tracking && !paused ? "animate-pulse" : ""}`}
              style={{ background: tracking && !paused ? accent : "rgb(var(--ink-faint))" }} />
            <span className="text-sm font-semibold">
              {!tracking ? "Ready" : paused ? "Paused" : "Recording"}
            </span>
          </div>
          {tracking && (
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Satellite className="h-3.5 w-3.5" style={{
                color: gpsQuality === "strong" ? "#22c55e" : gpsQuality === "ok" ? "#f59e0b" : "rgb(var(--ink-faint))",
              }} />
              <span className="text-ink-muted">
                {accuracy == null ? "Acquiring…" : `±${Math.round(accuracy)}m GPS`}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={RouteIcon} label="Distance" value={distanceKm.toFixed(2)} unit="km" accent={accent} />
          <Stat icon={Timer} label="Time" value={fmtDur(elapsed)} />
          <Stat icon={Gauge} label="Pace" value={fmtPace(livePace)} unit="/km" />
          <Stat icon={Flame} label="Calories" value={Math.round(calories).toString()} unit="kcal" accent={accent} />
        </div>

        <RouteTrace points={points} accent={accent} className="h-56 w-full" />

        {gpsError && (
          <p className="rounded-xl bg-ember-500/12 px-3.5 py-2.5 text-sm text-ember-500">{gpsError}</p>
        )}

        <div className="flex gap-3">
          {!tracking ? (
            <button onClick={start} className="btn-primary flex-1 py-3.5 text-base">
              <Play className="h-5 w-5" /> Start {KINDS.find((k) => k.key === kind)!.label.toLowerCase()}
            </button>
          ) : (
            <>
              <button onClick={togglePause}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-ink/15 bg-paper-card py-3.5 font-semibold text-ink-soft transition hover:border-ink/30">
                {paused ? <><Play className="h-5 w-5" /> Resume</> : <><Pause className="h-5 w-5" /> Pause</>}
              </button>
              <button onClick={finish} disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 py-3.5 font-bold text-white transition hover:bg-rose-600 disabled:opacity-60">
                <Square className="h-5 w-5" /> {saving ? "Saving…" : "Finish"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Recent activities */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent activities</h2>
          {feed.length > 0 && <span className="text-sm text-ink-muted">{feed.length} logged</span>}
        </div>

        {feed.length === 0 ? (
          <div className="card grid place-items-center gap-2 py-10 text-center text-ink-muted">
            <Navigation className="h-8 w-8 text-ink-faint" />
            <p className="font-medium text-ink-soft">No activities yet</p>
            <p className="text-sm">Start a walk, run or ride above — it'll show up here.</p>
          </div>
        ) : (
          <motion.div className="grid gap-3 sm:grid-cols-2"
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
            <AnimatePresence>
              {feed.map((a) => {
                const Icon = KIND_ICON[a.kind];
                const ac = KINDS.find((k) => k.key === a.kind)?.accent || "#8b93f8";
                return (
                  <motion.article key={a.id} layout
                    variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="card group flex gap-4">
                    <RouteTrace points={a.route} accent={ac} className="h-24 w-24 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `${ac}22`, color: ac }}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-bold">{a.kind_label}</span>
                        </div>
                        <button onClick={() => remove(a.id)} aria-label="Delete activity"
                          className="text-ink-faint opacity-0 transition hover:text-rose-400 group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-1 text-sm">
                        <div><div className="font-extrabold tabular-nums">{a.distance_km.toFixed(2)}</div><div className="text-[11px] text-ink-muted">km</div></div>
                        <div><div className="font-extrabold tabular-nums">{fmtDur(a.duration_s)}</div><div className="text-[11px] text-ink-muted">time</div></div>
                        <div><div className="font-extrabold tabular-nums">{Math.round(a.calories)}</div><div className="text-[11px] text-ink-muted">kcal</div></div>
                      </div>
                      <div className="mt-1.5 text-xs text-ink-faint">
                        {fmtPace(a.pace_min_km)} /km · {a.date}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}

export default function ActivityPage() {
  return <RequireAuth><ActivityInner /></RequireAuth>;
}
