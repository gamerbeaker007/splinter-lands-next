"use client";

import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import React from "react";

const data = [
  {
    id: "Dataset A",
    data: [
      {
        x: new Date("2025-06-01").getTime(),
        y: 10,
        size: 5,
      },
      {
        x: new Date("2025-06-02").getTime(),
        y: 15,
        size: 10,
      },
      {
        x: new Date("2025-06-03").getTime(),
        y: 5,
        size: 20,
      },
      {
        x: new Date("2025-06-04").getTime(),
        y: 20,
        size: 8,
      },
    ],
  },
];

export default function BubbleScatterChart() {
  return (
    <div style={{ height: 500 }}>
      <ResponsiveScatterPlot
        data={data}
        xScale={{ type: "linear", min: "auto", max: "auto" }}
        yScale={{ type: "linear", min: "auto", max: "auto" }}
        nodeSize={(d) => d.data.size} // ← dynamic bubble size
        colors={{ scheme: "category10" }}
        margin={{ top: 40, right: 40, bottom: 70, left: 90 }}
        axisBottom={{
          format: (value) => new Date(value as number).toLocaleDateString(),
          legend: "Date",
          legendPosition: "middle",
          legendOffset: 46,
        }}
        axisLeft={{
          legend: "Value 1",
          legendPosition: "middle",
          legendOffset: -60,
        }}
        useMesh={true}
        tooltip={({ node }) => (
          <div
            style={{
              padding: "6px 9px",
              borderRadius: "4px",
            }}
          >
            <strong>Date:</strong> {new Date(node.data.x).toLocaleDateString()}
            <br />
            <strong>Value 1:</strong> {node.data.y}
            <br />
            <strong>Size (Value 2):</strong> {node.data.size}
          </div>
        )}
      />
    </div>
  );
}
