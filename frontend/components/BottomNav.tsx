"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, Salad, Dumbbell, LineChart } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/diet", label: "Diet", icon: Salad },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[.08] bg-paper/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}
              className="group relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium">
              {active && <span aria-hidden className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-400 shadow-glow" />}
              <span className={`grid h-8 w-8 place-items-center rounded-xl transition ${
                active ? "bg-brand-400/15 text-brand-400" : "text-ink-muted group-hover:text-ink group-active:scale-90"}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className={active ? "text-brand-400" : "text-ink-faint"}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
