"use client";

import { ActiveDto } from "@/types/active";
import { useEffect, useState } from "react";

const MAX_PLOTS = 150_000;
export default function ActiveTile() {
  const [activeLatest, setActiveLatest] = useState<ActiveDto | null>(null);

  useEffect(() => {
    fetch("/api/active/latest")
      .then((res) => res.json())
      .then(setActiveLatest)
      .catch(console.error);
  }, []);

  return (
    <>
      <div
        className="card bg-accent-content rounded-3xl shadow-md flex items-center justify-center  w-[65px] h-[22px]"
        title="Percentage of active land based on PP"
      >
        <span className="text-xs">
          {(((activeLatest?.activeBasedOnPp ?? 0) / MAX_PLOTS) * 100).toFixed(
            1,
          )}
          %
        </span>
      </div>
    </>
  );
}
