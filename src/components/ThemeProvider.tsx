"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "quant_theme";

type ThemeContextValue = {
  isDark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggle: () => {},
  setDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false);

  // On mount: read explicitly saved preference only — default is always light
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Only go dark if user deliberately saved "dark"
    setIsDark(saved === "dark");
  }, []);

  // Whenever isDark changes: apply/remove .dark on <html> and persist
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark((v) => !v);
  const setDark = (v: boolean) => setIsDark(v);

  return (
    <ThemeContext.Provider value={{ isDark, toggle, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
