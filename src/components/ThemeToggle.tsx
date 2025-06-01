"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Read from localStorage and system preference on client
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDark]);

  return (
    <button
      className="fixed top-4 right-4 lg:right-6 z-30 btn btn-ghost btn-circle text-base-content"
      onClick={() => setIsDark(!isDark)}
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6 grid place-items-center">
        <div
          className={`absolute transition-all duration-500 ${
            isDark ? "-rotate-90 opacity-0" : "rotate-0 opacity-100"
          }`}
        >
          ☀️
        </div>
        <div
          className={`absolute transition-all duration-500 ${
            isDark ? "rotate-0 opacity-100" : "rotate-90 opacity-0"
          }`}
        >
          🌙
        </div>
      </div>
    </button>
  );
}
