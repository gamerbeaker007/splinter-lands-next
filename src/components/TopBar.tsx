"use client";
import ThemeToggle from "./ThemeToggle";

export default function TopBar() {
  return (
    <div className="navbar bg-base-100 border-b">
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </div>
  );
}
