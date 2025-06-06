"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useEffect, useState } from "react";

type RegionStats = {
  region: string;
  active: number;
  inactive: number;
};

export default function ActiveDeedsChart() {
  const [data, setData] = useState<RegionStats[]>([]);

  useEffect(() => {
    fetch("/api/deed/active")
      .then((res) => res.json())
      .then((raw) => {
        const transformed = Object.entries(raw).map(([region, count]) => ({
          region,
          active: Number(count),
          inactive: 1000 - Number(count),
        }));
        setData(transformed);
      })
      .catch(console.error);
  }, []);

  return (
    <div style={{ height: 550 }}>
      {/* Optional: Render live theme color preview */}
      <div className="hidden bg-base-100 text-base-content text-primary" />

      <ResponsiveBar
        data={data}
        keys={["active", "inactive"]}
        indexBy="region"
        margin={{ top: 20, right: 30, bottom: 100, left: 60 }}
        padding={0.3}
        groupMode="stacked"
        colors={({ id }) => (id === "active" ? "steelblue" : "#94a3b8")}
        axisBottom={{
          tickRotation: 45,
          legend: "Region",
          legendPosition: "middle",
          legendOffset: 75,
          tickSize: 5,
          tickPadding: 5,
          tickValues:
            data.length > 30
              ? data
                  .filter((_, i) => i % Math.ceil(data.length / 30) === 0)
                  .map((d) => d.region)
              : undefined,
        }}
        axisLeft={{
          legend: "Plots",
          legendPosition: "middle",
          legendOffset: -40,
        }}
        enableLabel={false}
        tooltip={({ id, value, data }) => (
          <div className="bg-base-200 text-sm text-base-content border border-base-300 rounded-md px-3 py-2 shadow-md w-[175px]">
            <div className="font-semibold">Region: {data.region}</div>
            <div>
              {id}: <strong>{value}</strong>
            </div>
          </div>
        )}
        animate
        role="application"
        ariaLabel="Active vs Inactive Deeds"
      />
    </div>
  );
}
