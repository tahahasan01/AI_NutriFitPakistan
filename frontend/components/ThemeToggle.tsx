"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { usePrefs } from "@/components/PrefsProvider";

export function ThemeToggle() {
  const { setTheme } = usePrefs();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    setTheme(next);
    setDark(next === "dark");
  }

  return (
    <button onClick={toggle} title="Toggle theme" aria-label="Toggle light/dark"
      className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted transition hover:bg-paper-warm hover:text-ink">
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
