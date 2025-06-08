"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";

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

  const regionLabels = data.map((d) => d.region);
  const activeCounts = data.map((d) => d.active);
  const inactiveCounts = data.map((d) => d.inactive);

  const maxTicks = 30;
  const tickInterval = Math.ceil(data.length / maxTicks);
  const tickRegions =
    data.length > maxTicks
      ? data.filter((_, i) => i % tickInterval === 0).map((d) => d.region)
      : regionLabels;
  console.log(tickRegions);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ height: 550 }}>
        <Typography variant="h6" gutterBottom>
          Nivo Bar Chart
        </Typography>
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
            <Box
              sx={{
                backgroundColor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                boxShadow: 3,
                p: 1.5,
                minWidth: 175,
                fontSize: "0.875rem",
                color: "text.primary",
              }}
            >
              <div style={{ fontWeight: 600 }}>Region: {data.region}</div>
              <div>
                {id}: <strong>{value}</strong>
              </div>
            </Box>
          )}
          animate
          role="application"
          ariaLabel="Active vs Inactive Deeds"
        />
      </Box>

      <Box sx={{ height: 550 }}>
        <Typography variant="h6" gutterBottom>
          MUI Bar Chart (Stacked, Limited Ticks)
        </Typography>
        <BarChart
          height={550}
          xAxis={[
            {
              id: "regions",
              data: regionLabels,
              scaleType: "band",
              label: "Region",
              tickLabelStyle: {
                fontSize: 10,
              },
            },
          ]}
          series={[
            {
              data: activeCounts,
              label: "Active",
              color: "steelblue",
              stack: "total",
            },
            {
              data: inactiveCounts,
              label: "Inactive",
              color: "#94a3b8",
              stack: "total",
            },
          ]}
          yAxis={[{ label: "Plots" }]}
          margin={{ bottom: 100 }}
        />
      </Box>
    </Box>
  );
}
