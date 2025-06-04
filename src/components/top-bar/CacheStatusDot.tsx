"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function CacheStatusDot() {
  const [status, setStatus] = useState<Status>("idle");
  const [info, setInfo] = useState<{
    lastUpdate: string;
    uniquePlayers: number;
  } | null>(null);

  useEffect(() => {
    setStatus("loading");
    fetch("/api/cache")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to refresh cache");
        return res.json();
      })
      .then((json) => {
        setInfo({
          lastUpdate: json.lastUpdate,
          uniquePlayers: json.uniquePlayers,
        });
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  const color = {
    idle: "bg-gray-400",
    loading: "bg-yellow-400 animate-pulse",
    success: "bg-green-500",
    error: "bg-red-500",
  }[status];

  return (
    <div className="relative group">
      <div className={`w-3 h-3 rounded-full ${color}`} />

      <div className="absolute left-1/2 top-full z-10 hidden w-max -translate-x-1/2 rounded-lg bg-base-200 p-2 text-xs shadow-md group-hover:block">
        <div>
          <strong>Data cached:</strong>
          <br />
          {new Date(info?.lastUpdate || "N/A").toLocaleDateString()}
        </div>
        <div className="mt-1">
          <strong>Unique Players:</strong>
          <br />
          {info?.uniquePlayers || 0}
        </div>
      </div>
    </div>
  );
}
