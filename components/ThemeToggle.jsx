"use client";

import { useEffect, useState } from "react";

// A light/dark switch. It toggles the `.dark` class on <html> (which re-points
// all the colour tokens in globals.css) and remembers the choice in
// localStorage. The matching inline script in layout.js applies the saved
// theme before first paint so there's no flash of the wrong theme.
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // On mount, read the class the inline script already applied.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode / blocked storage — just skip persistence.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
