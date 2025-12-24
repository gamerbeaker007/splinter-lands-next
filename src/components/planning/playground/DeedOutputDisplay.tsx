"use client";

import { calcProductionInfo } from "@/lib/frontend/utils/plannerCalcs";
import {
  PlotPlannerData,
  resourceWorksiteMap,
  RuniTier,
  SlotInput,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "@/types/planner";
import { PlaygroundDeed } from "@/types/playground";
import { Box, Typography } from "@mui/material";
import { useMemo } from "react";

type Props = {
  deed: PlaygroundDeed;
  selectedWorksite: WorksiteType | string;
  selectedRuni: RuniTier;
  selectedTitle: TitleTier | null;
  selectedTotem: TotemTier | null;
  selectedWorkers: (string | null)[];
  boostedPP: number;
};

export default function DeedOutputDisplay({
  deed,
  selectedWorksite,
  selectedRuni,
  selectedTitle,
  selectedTotem,
  selectedWorkers,
  boostedPP,
}: Props) {
  const output = useMemo(() => {
    const resource =
      selectedWorksite && resourceWorksiteMap[selectedWorksite as WorksiteType];

    if (!resource || !boostedPP) {
      return { produce: "-", consume: "-" };
    }

    // Build PlotPlannerData for calcProductionInfo
    const plotData: PlotPlannerData = {
      regionNumber: deed.region_number,
      tractNumber: deed.tract_number,
      plotStatus: deed.plotStatus,
      plotRarity: deed.rarity,
      magicType: deed.magicType || "",
      deedType: deed.deedType,
      worksiteType: selectedWorksite as WorksiteType,
      cardInput: [] as SlotInput[], // Card input not used for simple produce/consume calculation
      runi: selectedRuni,
      title: selectedTitle || "none",
      totem: selectedTotem || "none",
    };

    // Use simplified prices (set to 0 for display purposes)
    const prices = {
      dec: 0,
      sps: 0,
      grain: 0,
      stone: 0,
      wood: 0,
      essence: 0,
      research: 0,
      totems: 0,
    };

    try {
      const productionInfo = calcProductionInfo(
        deed.basePP,
        boostedPP,
        plotData,
        prices,
        1, // spsRatio
        null, // regionTax
        null // captureRate
      );

      // Format produce
      const produceText = productionInfo.produce
        .map((p) => `${p.resource}: ${p.amount.toFixed(4)}/hr`)
        .join(", ");

      // Format consume
      const consumeText = productionInfo.consume
        .map((c) => `${c.resource}: ${c.amount.toFixed(4)}/hr`)
        .join(", ");

      return {
        produce: produceText || "-",
        consume: consumeText || "-",
      };
    } catch (error) {
      console.error("Error calculating production:", error);
      return { produce: "Error", consume: "Error" };
    }
  }, [
    deed,
    selectedWorksite,
    selectedRuni,
    selectedTitle,
    selectedTotem,
    selectedWorkers,
    boostedPP,
  ]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

  return (
    <Box>
      <Typography variant="body2" fontSize="0.75rem" fontWeight="bold">
        BIG TODO NOT CORRECT YET
      </Typography>
      <Typography variant="body2" fontSize="0.7rem">
        PP: {fmt(boostedPP)}
      </Typography>
      <Typography variant="body2" fontSize="0.65rem" color="success.main">
        ▲ {output.produce}
      </Typography>
      <Typography variant="body2" fontSize="0.65rem" color="error.main">
        ▼ {output.consume}
      </Typography>
    </Box>
  );
}
