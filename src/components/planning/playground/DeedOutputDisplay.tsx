"use client";

import { formatNumberWithSuffix } from "@/lib/formatters";
import {
  calcProductionInfo,
  calcTotalPP,
} from "@/lib/frontend/utils/plannerCalcs";
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
import { WarningAmber } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { COLUMN_WIDTHS } from "./util/gridConstants";

type Props = {
  deed: PlaygroundDeed;
  selectedWorksite: WorksiteType | string;
  selectedRuni: RuniTier;
  selectedTitle: TitleTier | null;
  selectedTotem: TotemTier | null;
  selectedWorkers: (SlotInput | null)[]; // Changed from string UIDs to SlotInput
};

export default function DeedOutputDisplay({
  deed,
  selectedWorksite,
  selectedRuni,
  selectedTitle,
  selectedTotem,
  selectedWorkers,
}: Props) {
  const output = useMemo(() => {
    const resource =
      selectedWorksite && resourceWorksiteMap[selectedWorksite as WorksiteType];

    if (!resource) {
      return { produce: "-", consume: "-", boostedPP: 0, capped: false };
    }

    // Filter out null workers and create card input array
    const cardInput = selectedWorkers
      .filter((w): w is SlotInput => w !== null)
      .map((w, idx) => ({ ...w, id: idx + 1 }));

    // Build PlotPlannerData for calculation
    const plotData: PlotPlannerData = {
      regionNumber: deed.region_number,
      tractNumber: deed.tract_number,
      plotStatus: deed.plotStatus,
      plotRarity: deed.rarity,
      magicType: deed.magicType || "",
      deedType: deed.deedType,
      worksiteType: selectedWorksite as WorksiteType,
      cardInput,
      runi: selectedRuni,
      title: selectedTitle || "none",
      totem: selectedTotem || "none",
    };

    // Calculate boosted PP from plot data
    const { totalBasePP, totalBoostedPP, capped } = calcTotalPP(plotData);

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
        totalBasePP,
        totalBoostedPP,
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
        boostedPP: totalBoostedPP,
        capped,
      };
    } catch (error) {
      console.error("Error calculating production:", error);
      return {
        produce: "Error",
        consume: "Error",
        boostedPP: 0,
        capped: false,
      };
    }
  }, [
    deed,
    selectedWorksite,
    selectedRuni,
    selectedTitle,
    selectedTotem,
    selectedWorkers,
  ]);

  return (
    <Box width={COLUMN_WIDTHS.EXTRA_LARGE} flexShrink={0}>
      <Box>
        {output.capped && (
          <Typography variant="body2" fontSize="0.65rem" color="warning.main">
            <WarningAmber />
            BASE PP capped at 100,000
          </Typography>
        )}
        <Typography variant="body2" fontSize="0.7rem">
          PP: {formatNumberWithSuffix(output.boostedPP)}
        </Typography>
        <Typography variant="body2" fontSize="0.65rem" color="success.main">
          ▲ {output.produce}
        </Typography>
        <Typography variant="body2" fontSize="0.65rem" color="error.main">
          ▼ {output.consume}
        </Typography>
      </Box>
    </Box>
  );
}
