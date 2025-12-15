"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeCtx = {
  theme: Theme;
  snowEnabled: boolean;
  toggle: () => void;
  enableSnow: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export default function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>("light");
  const [snowEnabled, setSnowEnabled] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("theme") as Theme | null) : null;
    const storedSnow = typeof window !== "undefined" ? localStorage.getItem("snowEnabled") === "true" : false;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
    setSnowEnabled(storedSnow);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);

    const body = document.body;
    body.classList.add("theme-transition");
    const t = window.setTimeout(() => body.classList.remove("theme-transition"), 250);
    return () => window.clearTimeout(t);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("snowEnabled", snowEnabled.toString());
  }, [snowEnabled]);

  const enableSnow = () => {
    setTheme("dark");
    setSnowEnabled(true);
  };

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      snowEnabled,
      toggle: () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        if (newTheme === "light") {
          setSnowEnabled(false);
        }
      },
      enableSnow,
    }),
    [theme, snowEnabled]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}


