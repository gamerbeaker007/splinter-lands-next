"use client";
import ActiveTile from "./ActiveTile";
import ThemeToggle from "./ThemeToggle";

export default function TopBar() {
  return (
    <div className="navbar bg-base-100 border-b flex justify-between items-center px-4">
      {/* Left side (e.g., logo, nav links) */}
      <div className="text-lg font-bold">Dashboard</div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        <ActiveTile />
        <ThemeToggle />
      </div>
    </div>
  );
}
