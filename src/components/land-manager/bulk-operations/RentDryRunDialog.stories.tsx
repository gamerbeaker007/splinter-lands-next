import {
  DEFAULT_RENTAL_CONFIG,
  RentalEligiblePlot,
  RentalPlan,
  RentalPlanItem,
  RentalPlanPick,
} from "@/types/landManager";
import type { Meta, StoryObj } from "@storybook/react";
import RentDryRunDialog from "./RentDryRunDialog";

// ── Mock helpers ──────────────────────────────────────────────────────────────

const CARD_NAMES = [
  "Charlok Minotaur",
  "Radiated Scorcher",
  "Goblin Firebomb",
  "Serpent of Eld",
  "Exploding Rats",
];

const RESOURCES = ["GRAIN", "WOOD", "STONE", "IRON", "GRAIN"];

function makePlot(
  region: number,
  tract: number,
  plot: number,
  emptySlots = 5
): RentalEligiblePlot {
  return {
    // ── Deed fields (only the ones referenced by the dialog UI / filters) ──
    deed_uid: `${region}-${tract}-${plot}`,
    map_name: "praetoria",
    region_id: region,
    tract_id: tract,
    plot_id: region * 10000 + tract * 100 + plot,
    plot_number: plot,
    tract_number: tract,
    region_uid: `region-${region}`,
    region_number: region,
    territory: "centerra",
    resource_id: null,
    resource_symbol: RESOURCES[(region + tract + plot) % RESOURCES.length],
    magic_type: null,
    stats: null,
    player: "story-user",
    created_date: null,
    listed: false,
    lock_days: null,
    unlock_date: null,
    in_use: null,
    deed_type: null,
    land_stats: null,
    region_name: `Region ${region}`,
    market_updated_date: null,
    market_id: null,
    listing_price: null,
    market_listing_id: null,
    market_listing_status_id: null,
    castle: null,
    keep: null,
    rarity: null,
    plot_status: null,
    hex_code: null,
    tax_rate: null,
    item_detail_id: null,
    created_block_num: null,
    created_tx: null,
    worksite_type: "Grain Farm",
    time_crystal_value: null,
    rarity_sort_value: null,
    is_construction: false,
    worksiteDetail: null,
    stakingDetail: null,
    // ── Staking-derived fields ──
    worker_count: 0,
    max_workers: 5,
    empty_slots: emptySlots,
    is_powered: true,
    biome_modifiers: {
      fire: (region + tract) % 3 === 0 ? 0.25 : 0,
      water: (region + tract) % 3 === 1 ? 0.25 : 0,
      life: 0,
      death: 0,
      earth: (region + tract) % 3 === 2 ? 0.25 : 0,
      dragon: 0,
    },
  };
}

function makePick(idx: number): RentalPlanPick {
  const decPerDay = 4 + (idx % 5);
  const days = 14;
  return {
    market_id: `mkt-${idx}`,
    card_uid: `card-${idx}`,
    card_detail_id: 100 + (idx % CARD_NAMES.length),
    card_name: CARD_NAMES[idx % CARD_NAMES.length],
    edition: 1,
    foil: 0,
    gold: false,
    level: 3 + (idx % 3),
    color: "red",
    biome_modifier: idx % 4 === 0 ? 0.25 : 0,
    land_base_pp: 1100 + idx * 10,
    effective_pp: 1100 + idx * 10 + (idx % 4 === 0 ? 275 : 0),
    buy_price_per_day: decPerDay,
    rental_days: days,
    total_dec: decPerDay * days,
    pp_per_dec: (1100 + idx * 10) / (decPerDay * days),
    seller: `seller${idx % 5}`,
    expiration_date: "2026-06-10T00:00:00.000Z",
    card_image_url: "",
  };
}

function makeItem(
  region: number,
  tract: number,
  plot: number,
  pickCount: number,
  pickOffset = 0,
  skipReason?: string
): RentalPlanItem {
  const plt = makePlot(region, tract, plot);
  const picks = skipReason
    ? []
    : Array.from({ length: pickCount }, (_, i) => makePick(pickOffset + i));
  const slotsFilled = picks.length;
  return {
    plot: plt,
    picks,
    slots_filled: slotsFilled,
    slots_skipped: plt.empty_slots - slotsFilled,
    plot_total_dec: picks.reduce((s, p) => s + p.total_dec, 0),
    skip_reason: skipReason ?? null,
  };
}

function makeTotals(items: RentalPlanItem[]) {
  return {
    plots_total: items.length,
    plots_with_picks: items.filter((i) => i.picks.length > 0).length,
    slots_total: items.reduce((s, i) => s + i.plot.empty_slots, 0),
    slots_filled: items.reduce((s, i) => s + i.slots_filled, 0),
    total_dec: items.reduce((s, i) => s + i.plot_total_dec, 0),
  };
}

function makePlan(
  items: RentalPlanItem[],
  warnings: string[] = []
): RentalPlan {
  return {
    config: DEFAULT_RENTAL_CONFIG,
    items,
    totals: makeTotals(items),
    warnings,
    rental_days: 14,
    rental_days_source: "season 12 ends 2026-06-10 (14.0d left)",
  };
}

// ── Stories ───────────────────────────────────────────────────────────────────

const meta: Meta<typeof RentDryRunDialog> = {
  title: "Land Manager/Bulk Operations/RentDryRunDialog",
  component: RentDryRunDialog,
  args: {
    decBalance: 5000,
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof RentDryRunDialog>;

/** A small region with a mix of filled, partially filled, and skipped plots. */
export const FewPlots: Story = {
  args: {
    plan: makePlan(
      [
        makeItem(1, 1, 1, 5, 0),
        makeItem(1, 1, 2, 3, 5),
        makeItem(1, 1, 3, 0, 0, "no matching listings or budget exhausted"),
        makeItem(1, 2, 1, 5, 8),
        makeItem(
          1,
          2,
          2,
          0,
          0,
          "could not fill all slots (budget or biome match)"
        ),
      ],
      ["Biome filter active: earth only"]
    ),
  },
};

/** Simulates a 1 000-plot region (20 tracts × 50 plots). */
export const LargeRegion: Story = {
  args: {
    plan: (() => {
      const items: RentalPlanItem[] = [];
      let pickOffset = 0;
      for (let tract = 1; tract <= 20; tract++) {
        for (let plot = 1; plot <= 50; plot++) {
          const isSkipped = (tract + plot) % 7 === 0;
          const picks = isSkipped ? 0 : 5;
          items.push(
            makeItem(
              65,
              tract,
              plot,
              picks,
              pickOffset,
              isSkipped ? "no matching listings or budget exhausted" : undefined
            )
          );
          pickOffset += picks;
        }
      }
      return makePlan(items);
    })(),
  },
};

/** Empty plan — no eligible plots. */
export const Empty: Story = {
  args: {
    plan: makePlan([]),
  },
};
