"use client";

import { ResponsiveBar } from "@nivo/bar";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import { useFilters } from "@/lib/context/FilterContext";
import Plot from "react-plotly.js";
import { useTheme } from "@mui/material";

type Stats = {
  name: string;
  active: number;
  inactive: number;
};

export default function ActiveDeedsChart() {
  const { filters } = useFilters();
  const [data, setData] = useState<Stats[]>([]);
  const [xTitle, setXTitle] = useState<string>("");
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;

  useEffect(() => {
    if (!filters) return;

    fetch("/api/deed/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then((raw) => {
        const entries = Object.entries(raw);

        if (filters.filter_regions?.length === 1) {
          const transformed = entries.map(([tract_id, count]) => ({
            name: tract_id ?? "(unkown tract)",
            active: Number(count),
            inactive: 100 - Number(count),
          }));
          setXTitle("Tract");
          setData(transformed);
        } else {
          const transformed = entries.map(([region, count]) => ({
            name: region ?? "(unkown region)",
            active: Number(count),
            inactive: 1000 - Number(count),
          }));
          setXTitle("Region");
          setData(transformed);
        }
      })
      .catch(console.error);
  }, [filters]);

  const regionLabels = data.map((d) => d.name);
  const activeCounts = data.map((d) => d.active);
  const inactiveCounts = data.map((d) => d.inactive);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box sx={{ height: 550 }}>
        <Typography variant="h6" gutterBottom>
          Nivo Bar Chart
        </Typography>
        <ResponsiveBar
          data={data}
          keys={["active", "inactive"]}
          indexBy="name"
          margin={{ top: 20, right: 30, bottom: 100, left: 60 }}
          padding={0.3}
          groupMode="stacked"
          colors={({ id }) => (id === "active" ? "steelblue" : "#94a3b8")}
          axisBottom={{
            tickRotation: 45,
            legend: xTitle,
            legendPosition: "middle",
            legendOffset: 75,
            tickSize: 5,
            tickPadding: 5,
            tickValues:
              data.length > 30
                ? data
                    .filter((_, i) => i % Math.ceil(data.length / 30) === 0)
                    .map((d) => d.name)
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
              <div style={{ fontWeight: 600 }}>
                {xTitle}: {data.name}
              </div>
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
              label: xTitle,
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

      <Box sx={{ height: 550 }}>
        <Typography variant="h6" gutterBottom>
          Plotly Bar Chart (Stacked, Limited Ticks)
        </Typography>

        <Plot
          data={[
            {
              x: regionLabels,
              y: activeCounts,
              name: "Active",
              type: "bar",
              marker: { color: "steelblue" },
            },
            {
              x: regionLabels,
              y: inactiveCounts,
              name: "Inactive",
              type: "bar",
              marker: { color: "#94a3b8" },
            },
          ]}
          layout={{
            barmode: "stack",
            height: 500,
            margin: { b: 100 },
            xaxis: {
              title: { text: xTitle },
              tickfont: { size: 10 },
            },
            yaxis: {
              title: { text: "Plots" },
            },
            plot_bgcolor: backgroundColor,
            paper_bgcolor: backgroundColor,
            legend: { orientation: "h", y: -0.3 },
          }}
          style={{ width: "100%" }}
          config={{ responsive: true }}
        />
      </Box>
    </Box>
  );
}
