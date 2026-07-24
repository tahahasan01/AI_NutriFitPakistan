"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Leaf, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/Avatar";
import { usePrefs } from "@/components/PrefsProvider";
import { useAuth } from "@/app/providers";

const APP_ROUTES = ["/dashboard", "/log", "/diet", "/workout", "/progress", "/settings"];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { avatar } = usePrefs();
  const [open, setOpen] = useState(false);        // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop sidebar collapse
  const isApp = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (!isApp) {
    return (
      <>
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-ink-faint">
          NutriFit Pakistan · Estimates for planning, not medical advice.
        </footer>
      </>
    );
  }

  return (
    <div>
      <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} />

      <div className={`transition-[padding] duration-300 ${collapsed ? "lg:pl-0" : "lg:pl-64"}`}>
        {/* Top app bar — full width so controls never get clipped */}
        <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between gap-3 border-b border-ink/[.06] bg-paper/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            {/* mobile: open drawer */}
            <button onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-warm lg:hidden">
              <Menu className="h-5 w-5" /> Menu
            </button>
            {/* desktop: collapse / expand sidebar */}
            <button onClick={() => setCollapsed((c) => !c)}
              className="hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-paper-warm lg:flex">
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />} Menu
            </button>
            {/* brand: always on mobile; on desktop only when the sidebar is collapsed */}
            <Link href="/dashboard" className={`min-w-0 items-center gap-2 ${collapsed ? "flex" : "flex lg:hidden"}`}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-leaf-600 text-white"><Leaf className="h-4 w-4" /></span>
              <span className="truncate font-display text-lg font-semibold">NutriFit<span className="text-leaf-600"> PK</span></span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Link href="/settings" title="Settings"
              className={`grid h-9 w-9 place-items-center rounded-lg transition ${
                pathname === "/settings" ? "bg-brand-500/12 text-brand-600" : "text-ink-muted hover:bg-paper-warm hover:text-ink"}`}>
              <Settings className="h-5 w-5" />
            </Link>
            <Link href="/settings" title="Account" className="ml-1">
              <Avatar src={avatar} name={user?.name} size={32} />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-ink-faint">
          NutriFit Pakistan · Estimates for planning, not medical advice.
        </footer>
      </div>
    </div>
  );
}
