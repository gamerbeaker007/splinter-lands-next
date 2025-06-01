"use client";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const titles: Record<string, string> = {
  "/": "Home",
  "/resource": "Resource",
  "/region-overview": "Region Overview",
  "/region-production-overview": "Region Production Overview",
  "/player-overview": "Player Overview",
};

export default function TopBar() {
  const pathname = usePathname();
  const title = titles[pathname] || "Splinterlands Statistics";

  return (
    <div className="navbar bg-base-100 border-b px-4">
      <div className="text-xl font-semibold">{title}</div>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </div>
  );
}
