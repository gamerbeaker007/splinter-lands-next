"use client";

import { CardBloodLineSelector } from "@/components/planning/card-editor/CardBloodLineSelector";
import { computeSlot } from "@/lib/frontend/utils/plannerCalcs";
import { CSSSize } from "@/types/cssSize";
import { PlotPlannerData, SlotInput } from "@/types/planner";
import { Box, Typography } from "@mui/material";
import { BcxInput } from "./BcxInput";
import { CardFoilSelector } from "./CardFoilSelector";
import { CardPPInfo } from "./CardPPInfo";
import { CardRaritySelector } from "./CardRaritySelector";
import { CardElementSelector } from "./ElementSelector";
import LandBoostComponent from "./LandBoost";
import { SetSelector } from "./SetSelector";

type Props = {
  index: number; // 0..4 (displayed as 1..5)
  value: SlotInput;
  plot: PlotPlannerData;
  onChange: (next: SlotInput) => void;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export default function SlotEditor({
  index,
  value,
  plot,
  onChange,
  pos,
}: Props) {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const onSelect =
    <K extends keyof SlotInput>(key: K) =>
    (val: SlotInput[K]) =>
      onChange({ ...value, [key]: val });

  const computed = computeSlot(value, plot);

  const fontColor = "common.white";
  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        top: y,
        left: x,
        width: w,
        p: 1,
        bgcolor: "rgba(0,0,0,0.45)",

        zIndex: 2,
      }}
    >
      <Box display={"flex"} flexDirection={"row"} gap={0.5}>
        <Box
          width={5}
          minWidth={5}
          display="flex"
          justifyContent="center"
          alignItems="center"
          textAlign="center"
        >
          <Typography variant="subtitle1" color={fontColor}>
            {index + 1}
          </Typography>
        </Box>
        <SetSelector value={value.set} onChange={onSelect("set")} />
        <CardRaritySelector
          value={value.rarity}
          onChange={onSelect("rarity")}
        />
        <CardFoilSelector
          value={value.foil}
          set={value.set}
          onChange={onSelect("foil")}
        />
        <CardElementSelector
          value={value.element}
          deedType={plot.deedType}
          onChange={onSelect("element")}
        />
        <BcxInput
          slot={value}
          onChange={(bcx) => onChange({ ...value, bcx })}
        />

        <CardBloodLineSelector
          value={value.bloodline}
          onChange={onSelect("bloodline")}
        />

        <LandBoostComponent
          initialBloodline={plot.cardInput[index].bloodline}
          boosts={plot.cardInput[index].landBoosts}
          onSave={(boost) => {
            onChange({ ...plot.cardInput[index], landBoosts: boost });
          }}
        />
        <CardPPInfo
          basePP={computed.basePP}
          boostedPP={computed.boostedPP}
          isCapped={computed.isCapped}
        />
      </Box>
    </Box>
  );
}
