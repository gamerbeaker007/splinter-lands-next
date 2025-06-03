"use client";
import { useEffect, useState } from "react";
import { LuMoon, LuSun } from "react-icons/lu";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  // Determine initial theme
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme = stored ?? (prefersDark ? "dark" : "light");
    setIsDark(theme === "dark");

    // Apply immediately
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute(
      "data-theme",
      theme === "dark" ? "dark" : "cupcake",
    );
  }, []);

  // Update on toggle
  useEffect(() => {
    if (isDark === null) return;
    const theme = isDark ? "dark" : "cupcake";
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", theme);
  }, [isDark]);

  if (isDark === null) return null;

  return (
    <label
      className="flex top-4 right-4 lg:right-6 z-30 cursor-pointer"
      aria-label="Toggle theme"
    >
      <input
        type="checkbox"
        className="hidden"
        checked={isDark}
        onChange={() => setIsDark(!isDark)}
      />
      <div className="relative w-[50px] h-[22px] bg-sky-700/50 rounded-full transition-colors duration-300">
        <div
          className={`absolute top-[3px] w-[16px] h-[16px] bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            !isDark ? "translate-x-[3px]" : "translate-x-[31px]"
          }`}
        />
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs">
          <LuSun className="text-white" />
        </span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs">
          <LuMoon className="text-white" />
        </span>
      </div>
    </label>
  );
}
