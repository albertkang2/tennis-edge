"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const nextDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    setIsDark(nextDark);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border border-black/15 bg-black/[.04] px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-black/[.08] dark:border-white/15 dark:bg-white/[.08] dark:hover:bg-white/[.12]"
      aria-label={isDark ? "Switch to light mode" : "Switch to night mode"}
    >
      {isDark ? "Light mode" : "Night mode"}
    </button>
  );
}
