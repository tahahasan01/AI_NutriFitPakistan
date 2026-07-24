"use client";

const COLORS = { protein: "#6366f1", carbs: "#f59e0b", fat: "#f43f5e" };

interface Props {
  protein: number;
  carbs: number;
  fat: number;
  centerLabel?: string;
  centerSub?: string;
  size?: number;
}

/** SVG donut showing the calorie split across protein/carbs/fat. */
export function MacroDonut({ protein, carbs, fat, centerLabel, centerSub, size = 140 }: Props) {
  const kcal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
  const total = kcal.protein + kcal.carbs + kcal.fat || 1;
  const r = 54;
  const c = 2 * Math.PI * r;
  const stroke = 16;

  let offset = 0;
  const segs = (["protein", "carbs", "fat"] as const).map((k) => {
    const frac = kcal[k] / total;
    const seg = { k, dash: frac * c, gap: c - frac * c, offset: -offset * c, color: COLORS[k] };
    offset += frac;
    return seg;
  });

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
        {segs.map((s) => (
          <circle
            key={s.k}
            cx="70" cy="70" r={r} fill="none"
            stroke={s.color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset}
          />
        ))}
      </svg>
      {centerLabel && (
        <div className="absolute text-center">
          <div className="text-2xl font-extrabold leading-none">{centerLabel}</div>
          {centerSub && <div className="mt-1 text-xs text-ink-muted">{centerSub}</div>}
        </div>
      )}
    </div>
  );
}

export function MacroLegend({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const items = [
    { label: "Protein", val: protein, color: COLORS.protein },
    { label: "Carbs", val: carbs, color: COLORS.carbs },
    { label: "Fat", val: fat, color: COLORS.fat },
  ];
  return (
    <div className="flex flex-wrap gap-4">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: i.color }} />
          <span className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">{Math.round(i.val)}g</span> {i.label}
          </span>
        </div>
      ))}
    </div>
  );
}
