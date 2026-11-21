import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  latest: undefined as ResourceSupplyOverview | undefined,
  historical: undefined as ResourceSupplyOverview[] | undefined,
  selected: [] as string[],
  dailyData: undefined as ResourceSupplyOverview | undefined,
  historicalData: undefined as ResourceSupplyOverview[] | undefined,
}));

vi.mock("@/lib/backend/actions/resources/supply-actions", () => ({
  getLatestResourceSupply: vi.fn(),
  getAllResourceSupply: vi.fn(),
}));
vi.mock("@/hooks/useAsyncData", () => ({
  useAsyncData: (key: string) => ({
    data: key === "latest-resource-supply" ? mocks.latest : mocks.historical,
    loading: false,
    error: null,
  }),
}));
vi.mock("@/components/resource/ResourceIconToggleGroup", () => ({
  ResourceIconToggleGroup: ({ value }: { value: string[] }) => {
    mocks.selected = value;
    return null;
  },
}));
vi.mock("./daily/DailyProductionConsumeOverview", () => ({
  DailyProduceConsumeOverview: ({ data }: { data: ResourceSupplyOverview }) => {
    mocks.dailyData = data;
    return null;
  },
}));
vi.mock("./historical/ProduceConsumeHistoricalOverview", () => ({
  ProduceConsumeHistoricalOverview: ({
    data,
  }: {
    data: ResourceSupplyOverview[];
  }) => {
    mocks.historicalData = data;
    return null;
  },
}));

import { filterResourceSupply, SupplyPage } from "./SupplyPage";

function overview(symbols: string[]): ResourceSupplyOverview {
  return {
    date: "2026-01-01",
    resource: Object.fromEntries(
      symbols.map((symbol) => [
        symbol,
        {
          supply: 10,
          trade_hub_supply: 2,
          daily_production: 3,
          daily_consume: 1,
          consumes: { grain: 0, wood: 0, stone: 0, iron: 0 },
        },
      ])
    ),
  };
}

describe("supply resource selection", () => {
  beforeEach(() => {
    mocks.latest = undefined;
    mocks.historical = undefined;
    mocks.selected = [];
    mocks.dailyData = undefined;
    mocks.historicalData = undefined;
  });

  it("enables all resources from both latest and historical data by default", () => {
    const symbols = Array.from(
      { length: 36 },
      (_, index) => `RESOURCE${index}`
    );
    mocks.latest = overview(symbols.slice(0, 20));
    mocks.historical = [overview(symbols.slice(10))];
    renderToStaticMarkup(createElement(SupplyPage));
    expect(mocks.selected).toEqual(symbols);
    expect(Object.keys(mocks.dailyData?.resource ?? {})).toEqual(
      symbols.slice(0, 20)
    );
    expect(Object.keys(mocks.historicalData?.[0].resource ?? {})).toEqual(
      symbols.slice(10)
    );
  });

  it("filters each snapshot without changing amounts or the original data", () => {
    const original = overview(["GRAIN", "WOOD", "NEW"]);
    const filtered = filterResourceSupply(original, new Set(["WOOD", "NEW"]));
    expect(Object.keys(filtered.resource)).toEqual(["WOOD", "NEW"]);
    expect(filtered.resource.WOOD).toEqual(original.resource.WOOD);
    expect(Object.keys(original.resource)).toEqual(["GRAIN", "WOOD", "NEW"]);
    expect(filterResourceSupply(original, new Set()).resource).toEqual({});
  });
});
