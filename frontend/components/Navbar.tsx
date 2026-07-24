"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Salad, Dumbbell, LineChart, LogOut, Leaf } from "lucide-react";
import { useAuth } from "@/app/providers";

const links = [
  { href: "/diet", label: "Diet", icon: Salad },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-[17px] font-extrabold tracking-tight">
            NutriFit<span className="text-brand-600"> PK</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {user &&
            links.map((l) => {
              const active = pathname === l.href;
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`btn-chip ${
                    active
                      ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                      : "text-ink-muted hover:bg-slate-100 hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
          {user ? (
            <button onClick={handleLogout} className="btn-ghost ml-1 px-3 py-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          ) : (
            <Link href="/" className="btn-primary px-4 py-2">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
