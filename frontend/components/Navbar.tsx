"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";

const links = [
  { href: "/diet", label: "Diet" },
  { href: "/workout", label: "Workout" },
  { href: "/progress", label: "Progress" },
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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand">
          NutriFit<span className="text-slate-800"> Pakistan</span>
        </Link>

        <nav className="flex items-center gap-1">
          {user &&
            links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  pathname === l.href
                    ? "bg-brand/10 text-brand"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          {user ? (
            <button onClick={handleLogout} className="btn-ghost ml-2 py-1.5 text-sm">
              Log out
            </button>
          ) : (
            <Link href="/" className="btn-primary py-1.5 text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
