import { ResourceHubMetrics } from "@/generated/prisma/client";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const plot = vi.hoisted(() => ({
  traces: [] as Partial<Plotly.ScatterData>[],
}));

vi.mock("@/components/ui/graph/FullscreenPlotWrapper", () => ({
  FullscreenPlotWrapper: ({
    data,
  }: {
    data: Partial<Plotly.ScatterData>[];
  }) => {
    plot.traces = data;
    return null;
  },
}));

import { useResourceChartSelection } from "@/components/resource/ResourceChartFilter";
import { ResourceFactorChart } from "@/components/resource/conversion/factor/ResourceFactorChart";
import TradeHubVolumeChart from "@/components/resource/trade-hub/TradeHubVolumeChart";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";

function metric(symbol: string, decVolume: number): ResourceHubMetrics {
  const date = new Date("2026-01-01T00:00:00Z");
  return {
    date,
    id: 1,
    token_symbol: symbol,
    resource_quantity: "100",
    resource_volume: 0,
    resource_volume_1: 10,
    resource_volume_30: null,
    resource_price: 1,
    dec_quantity: "100",
    dec_volume: 0,
    dec_volume_1: decVolume,
    dec_volume_30: null,
    total_shares: "100",
    created_date: date,
    last_updated_date: date,
    dec_price: 1,
    dec_usd_value: 1,
    grain_equivalent: 1,
    factor: 1,
  };
}

describe("resource chart selection", () => {
  it("shows a manageable initial selection when many pools exist", () => {
    const data = Array.from({ length: 36 }, (_, i) =>
      metric(`RESOURCE${i}`, 1)
    );
    function Probe() {
      const { selected, filteredData } = useResourceChartSelection(data);
      return createElement(
        "span",
        null,
        `${selected.length}:${filteredData?.length}`
      );
    }
    expect(renderToStaticMarkup(createElement(Probe))).toContain("6:6");
  });

  it("keeps all pools visible for the existing small set", () => {
    const data = [metric("WOOD", 1), metric("IRON", 2)];
    function Probe() {
      const { selected } = useResourceChartSelection(data);
      return createElement("span", null, selected.join(","));
    }
    expect(renderToStaticMarkup(createElement(Probe))).toContain("WOOD,IRON");
  });

  it("defaults conversion charts to available natural resources", () => {
    const data = [
      metric("NEW", 1),
      metric("IRON", 1),
      metric("GRAIN", 1),
      metric("STONE", 1),
      metric("WOOD", 1),
    ];
    function Probe() {
      const { selected, filteredData } = useResourceChartSelection(
        data,
        NATURAL_RESOURCES
      );
      return createElement(
        "span",
        null,
        `${selected.join(",")}:${filteredData?.length}`
      );
    }
    expect(renderToStaticMarkup(createElement(Probe))).toContain(
      "GRAIN,WOOD,STONE,IRON:4"
    );
  });

  it("keeps the grain factor chart limited to comparable resources", () => {
    renderToStaticMarkup(
      createElement(ResourceFactorChart, {
        data: [
          metric("GRAIN", 1),
          metric("WOOD", 1),
          metric("STONE", 1),
          metric("IRON", 1),
          metric("NEW", 1),
        ],
      })
    );
    expect(plot.traces.map((trace) => trace.name)).toEqual([
      "WOOD",
      "STONE",
      "IRON",
      "DEC/USD",
      "1.00 (Grain baseline)",
    ]);
    expect(plot.traces[3].x).toHaveLength(5);
  });

  it("filters pool traces without changing the all-pool total", () => {
    renderToStaticMarkup(
      createElement(TradeHubVolumeChart, {
        data: [metric("WOOD", 0), metric("IRON", 20), metric("NEW", 5)],
        selectedSymbols: ["WOOD"],
      })
    );
    expect(plot.traces.map((trace) => trace.name)).toEqual([
      "WOOD",
      "WOOD DEC vol",
      "Total DEC volume (all pools)",
    ]);
    expect(plot.traces[2].y).toEqual([25]);
  });
});
