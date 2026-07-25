"use client";

export function CalorieRing({ eaten, target, size = 168 }: { eaten: number; target: number; size?: number }) {
  const pct = target > 0 ? Math.min(1, eaten / target) : 0;
  const over = target > 0 && eaten > target;
  const remaining = Math.max(0, Math.round(target - eaten));
  const r = 76;
  const c = 2 * Math.PI * r;
  const stroke = 14;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 176 176" className="-rotate-90">
        <circle cx="88" cy="88" r={r} fill="none" stroke="rgb(var(--paper-warm))" strokeWidth={stroke} />
        <defs>
          <linearGradient id="cal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={over ? "#f43f5e" : "#f2542d"} />
            <stop offset="100%" stopColor={over ? "#f43f5e" : "#f7a63a"} />
          </linearGradient>
        </defs>
        <circle cx="88" cy="88" r={r} fill="none" stroke="url(#cal)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-3xl font-semibold leading-none">{Math.round(eaten)}</div>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-ink-muted">of {Math.round(target)} kcal</div>
        <div className={`mt-1 text-xs font-semibold ${over ? "text-rose-500" : "text-brand-600"}`}>
          {over ? `${Math.round(eaten - target)} over` : `${remaining} left`}
        </div>
      </div>
    </div>
  );
}
