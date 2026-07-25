"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Salad, Dumbbell, LineChart, LogOut, Leaf, LayoutDashboard, CalendarDays } from "lucide-react";
import { useAuth } from "@/app/providers";
import { usePrefs } from "@/components/PrefsProvider";
import { Avatar } from "@/components/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/log", label: "Today", icon: CalendarDays },
  { href: "/diet", label: "Diet", icon: Salad },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { avatar } = usePrefs();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink/[.06] bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-600 text-white ring-1 ring-leaf-700">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="whitespace-nowrap font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
            NutriFit<span className="text-leaf-600"> PK</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {user &&
            links.map((l) => {
              const active = pathname === l.href;
              const Icon = l.icon;
              return (
                <Link key={l.href} href={l.href}
                  className={`btn-chip px-2.5 sm:px-3.5 ${active
                    ? "bg-brand-500/12 text-brand-600"
                    : "text-ink-muted hover:bg-paper-warm hover:text-brand-500"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
          {user ? (
            <>
              <Link href="/settings" title="Settings"
                className={`ml-1 rounded-full ring-2 transition ${
                  pathname === "/settings" ? "ring-brand-500" : "ring-transparent hover:ring-ink/15"}`}>
                <Avatar src={avatar} name={user.name} size={34} />
              </Link>
              <button onClick={handleLogout} className="btn-ghost ml-1 hidden px-3 py-1.5 sm:inline-flex">
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost whitespace-nowrap px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">Log in</Link>
              <Link href="/signup" className="btn-accent whitespace-nowrap px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">Get started</Link>
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
