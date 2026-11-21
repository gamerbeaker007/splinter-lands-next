import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { createElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ player: "alice" }));

vi.mock("@/lib/frontend/context/PlayerContext", () => ({
  usePlayer: () => ({ selectedPlayer: mocks.player }),
}));
vi.mock("@/components/player-overview/PlayerInput", () => ({
  default: () => null,
}));
vi.mock("@/components/ui/WeeklyDataAlert", () => ({
  default: () => null,
}));
vi.mock("./TradeHubTokenSection", () => ({
  TradeHubTokenSection: ({ token }: { token: string }) =>
    createElement("span", null, `Chart: ${token}`),
}));
vi.mock("@mui/material", async (importOriginal) => {
  const original = await importOriginal<typeof import("@mui/material")>();
  return {
    ...original,
    Tooltip: ({ children, title }: { children: ReactNode; title: ReactNode }) =>
      createElement("div", null, children, title),
  };
});

import TradeHubPositionPage from "./TradeHubPositionsPage";
import { playerPoolStanding, prepareTradeHubPools } from "./poolRankings";

function position(
  token: string,
  player: string,
  share: number
): PlayerTradeHubPosition {
  return {
    date: new Date("2026-01-01"),
    player,
    token,
    balance: 1,
    total_fees_earned_dec: 0,
    total_fees_earned_resource: 0,
    fees_earned_dec_1: 0,
    fees_earned_resource_1: 0,
    fees_earned_dec_30: 0,
    fees_earned_resource_30: 0,
    share_percentage: share,
    resource_quantity: 123,
    dec_quantity: 456,
  };
}

describe("trade hub positions", () => {
  beforeEach(() => {
    mocks.player = "alice";
  });

  it("excludes SPS, ranks consistently, and keeps other pool names", () => {
    const pools = prepareTradeHubPools({
      "DEC-SPS": [position("DEC-SPS", "alice", 50)],
      "DEC-GRAIN": [
        position("DEC-GRAIN", "alice", 10),
        position("DEC-GRAIN", "bob", 20),
      ],
      "DEC-SPSX": [position("DEC-SPSX", "alice", 5)],
    });
    expect(pools.map((pool) => pool.token)).toEqual(["DEC-GRAIN", "DEC-SPSX"]);
    expect(
      playerPoolStanding(pools[0].positions, pools[0].ranked, "alice").rank
    ).toBe(2);
    expect(
      playerPoolStanding(pools[0].positions, pools[0].ranked, "missing")
    ).toEqual({
      position: undefined,
      rank: null,
    });
  });

  it("shows all snapshot pools in the player summary even when not selected", () => {
    const tokens = Object.fromEntries(
      ["GRAIN", "WOOD", "STONE", "IRON", "NEW", "SPS"].map((resource) => {
        const token = `DEC-${resource}`;
        return [
          token,
          resource === "WOOD"
            ? [position(token, "bob", 5)]
            : [position(token, "bob", 20), position(token, "alice", 10.12356)],
        ];
      })
    );
    const html = renderToStaticMarkup(
      createElement(TradeHubPositionPage, {
        groupedPlayerTradeHubPosition: { date: null, tokens },
      })
    );
    expect(html).toContain("DEC-NEW");
    expect(html).not.toContain("Chart: DEC-NEW");
    expect(html).not.toContain("DEC-SPS");
    expect(html).toContain("Not in snapshot");
    expect(html).toContain("Position:");
    expect(html).toContain("#2");
    expect(html).toContain("10.124%");
    expect(html).toContain("NEW: 123");
    expect(html).toContain("DEC: 456");
  });

  it("does not display player cards until a player is entered", () => {
    mocks.player = "";
    const html = renderToStaticMarkup(
      createElement(TradeHubPositionPage, {
        groupedPlayerTradeHubPosition: {
          date: null,
          tokens: { "DEC-GRAIN": [position("DEC-GRAIN", "alice", 10)] },
        },
      })
    );
    expect(html).not.toContain("pool positions");
    expect(html).not.toContain("Chart: DEC-GRAIN");
    expect(html).toContain("0 of 1 pools selected");
  });
});
