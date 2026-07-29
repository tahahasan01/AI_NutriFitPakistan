"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Salad, Dumbbell, LineChart, Settings, LogOut, Leaf, X, Sparkles, Navigation,
} from "lucide-react";
import { useAuth } from "@/app/providers";
import { usePrefs } from "@/components/PrefsProvider";
import { Avatar } from "@/components/Avatar";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/coach", label: "AI Coach", icon: Sparkles },
  { href: "/log", label: "Today", icon: CalendarDays },
  { href: "/diet", label: "Diet plan", icon: Salad },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/activity", label: "Track", icon: Navigation },
  { href: "/progress", label: "Progress", icon: LineChart },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { avatar } = usePrefs();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    onNavigate?.();
    router.push("/");
  }

  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600 text-white ring-1 ring-leaf-700">
          <Leaf className="h-5 w-5" />
        </span>
        <span className="font-display text-xl font-semibold tracking-tight text-ink">
          NutriFit<span className="text-leaf-600"> PK</span>
        </span>
      </Link>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {links.map((l) => {
          const active = pathname === l.href;
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-500/12 text-brand-600" : "text-ink-muted hover:bg-paper-warm hover:text-ink"}`}>
              <Icon className="h-5 w-5" /> {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink/[.07] p-3">
        <Link href="/settings" onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
            pathname === "/settings" ? "bg-brand-500/12" : "hover:bg-paper-warm"}`}>
          <Avatar src={avatar} name={user?.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user?.name || "Athlete"}</div>
            <div className="flex items-center gap-1 text-xs text-ink-muted"><Settings className="h-3 w-3" /> Settings</div>
          </div>
        </Link>
        <button onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-paper-warm hover:text-ink">
          <LogOut className="h-5 w-5" /> Log out
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose, collapsed }: { open: boolean; onClose: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  // close the mobile drawer whenever the route changes
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Desktop fixed sidebar (hidden when collapsed) */}
      <aside className={`fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink/[.07] bg-paper-card/80 backdrop-blur-sm ${collapsed ? "" : "lg:block"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={onClose} />
        <aside className={`absolute inset-y-0 left-0 w-72 bg-paper-card shadow-lift transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={onClose} className="absolute right-3 top-4 text-ink-muted hover:text-ink"><X className="h-5 w-5" /></button>
          <SidebarContent onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}
