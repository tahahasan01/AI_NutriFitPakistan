"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Leaf } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

const APP_ROUTES = ["/dashboard", "/log", "/diet", "/workout", "/progress", "/settings"];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isApp = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  if (!isApp) {
    // Marketing / auth pages keep the top navbar
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

  // Logged-in app: sidebar shell
  return (
    <div>
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-ink/[.06] bg-paper/85 px-4 backdrop-blur-md lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-paper-warm">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-leaf-600 text-white"><Leaf className="h-4 w-4" /></span>
          <span className="font-display text-lg font-semibold">NutriFit<span className="text-leaf-600"> PK</span></span>
        </Link>
      </div>

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-xs text-ink-faint">
          NutriFit Pakistan · Estimates for planning, not medical advice.
        </footer>
      </div>
    </div>
  );
}
