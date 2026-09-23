"use client";

import ActionPlanDialog from "@/components/land-manager/harvest/ActionPlanDialog";
import {
  harvestPreviewRows,
  makeHarvestablePreviewRows,
  processResourcesPreviewRows,
} from "@/lib/frontend/preview/actionPreviewRows";
import { ActionPlan } from "@/types/landManager";
import { Button, Stack } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

// The confirm dialog with plans shaped like the real planners' output, so the
// summary layout can be checked without an account, a chain or live pool
// prices. Nothing here broadcasts — Confirm just closes the dialog.

const meta: Meta = {
  title: "Land Manager/Action Plan Dialog",
  parameters: { layout: "padded" },
};

export default meta;

const PLANS: ActionPlan[] = [
  {
    title: "Review plan — Make All Harvestable",
    rows: makeHarvestablePreviewRows([
      {
        type: "pool",
        from_region: "POOL",
        to_region: "A",
        from_symbol: "GRAIN",
        to_symbol: "GRAIN",
        in_amount: 0.2,
        out_amount: 1200,
        dec_amount: 90,
      },
      {
        type: "pool",
        from_region: "POOL",
        to_region: "A",
        from_symbol: "STONE",
        to_symbol: "STONE",
        in_amount: 0.1,
        out_amount: 400,
        dec_amount: 30,
      },
      {
        type: "transfer",
        from_region: "B",
        to_region: "A",
        from_symbol: "GRAIN",
        to_symbol: "GRAIN",
        in_amount: 340,
        out_amount: 300,
      },
      {
        type: "swap",
        from_region: "B",
        to_region: "A",
        from_symbol: "WOOD",
        to_symbol: "GRAIN",
        in_amount: 500,
        out_amount: 420,
      },
      {
        type: "buy_dec",
        from_region: "DEC",
        to_region: "A",
        from_symbol: "DEC",
        to_symbol: "STONE",
        in_amount: 1150,
        out_amount: 200,
      },
    ]),
    log: [
      "[Region A] needs: 1500 GRAIN, 600 STONE",
      "  ✓ Pool: withdraw 20.0% of GRAIN position → 1200 GRAIN + 90 DEC in Region A (no fee)",
      "  ✓ Swap: 500 WOOD from Region B → 420 GRAIN in Region A",
      "  ✓ Buy: 1150 DEC → 200 STONE in Region A",
    ],
  },
  {
    title: "Review plan — Harvest All",
    rows: harvestPreviewRows(
      { GRAIN: 24500, WOOD: 8100, STONE: 3200, IRON: 410 },
      { GRAIN: 490, WOOD: 162 }
    ),
    log: [
      "Harvest Region A",
      "Harvest Region B",
      "Donate 490 GRAIN to beaker007",
    ],
  },
  {
    title: "Review plan — Process Resources",
    rows: processResourcesPreviewRows([
      {
        type: "sell_for_dec",
        region_uid: "R1",
        symbol: "GRAIN",
        resource_amount: 12000,
        dec_amount: 216,
      },
      {
        type: "add_to_pool",
        region_uid: "R1",
        symbol: "WOOD",
        resource_amount: 4000,
        dec_amount: 180,
      },
    ]),
    log: ["Sell 12000 GRAIN → ~216 DEC", "Add 4000 WOOD + 180 DEC to pool"],
  },
  {
    // No rows: the planner found nothing to do, so the log stands on its own.
    title: "Review plan — Top Up Pools",
    rows: [],
    log: ["GRAIN: skipped — not enough DEC to fund the deposit"],
  },
];

function Gallery() {
  const [open, setOpen] = useState<ActionPlan | null>(null);
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {PLANS.map((plan) => (
        <Button
          key={plan.title}
          variant="outlined"
          onClick={() => setOpen(plan)}
        >
          {plan.title}
        </Button>
      ))}
      {open && (
        <ActionPlanDialog
          plan={open}
          busy={false}
          onConfirm={() => setOpen(null)}
          onClose={() => setOpen(null)}
        />
      )}
    </Stack>
  );
}

export const Gallery_: StoryObj = {
  name: "Gallery",
  render: () => <Gallery />,
};
