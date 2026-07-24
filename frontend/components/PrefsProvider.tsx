"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface PrefsState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  avatar: string | null;
  setAvatar: (dataUrl: string | null) => void;
}

const PrefsContext = createContext<PrefsState | null>(null);
const THEME_KEY = "nutrifit_theme";
const AVATAR_KEY = "nutrifit_avatar";

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [avatar, setAvatarState] = useState<string | null>(null);

  useEffect(() => {
    const t = (localStorage.getItem(THEME_KEY) as Theme) || "dark";
    setThemeState(t);
    applyTheme(t);
    setAvatarState(localStorage.getItem(AVATAR_KEY));

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if ((localStorage.getItem(THEME_KEY) || "dark") === "system") applyTheme("system");
    };
    mq.addEventListener("change", onSystem);
    return () => mq.removeEventListener("change", onSystem);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  }

  function setAvatar(dataUrl: string | null) {
    setAvatarState(dataUrl);
    if (dataUrl) localStorage.setItem(AVATAR_KEY, dataUrl);
    else localStorage.removeItem(AVATAR_KEY);
  }

  return (
    <PrefsContext.Provider value={{ theme, setTheme, avatar, setAvatar }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
