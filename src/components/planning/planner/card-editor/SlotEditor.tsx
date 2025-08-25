"use client";

import { CSSSize } from "@/types/cssSize";
import { PlotModifiers, SlotInput } from "@/types/planner";
import { Box, Typography } from "@mui/material";
import { computeSlot } from "../../utils/calc";
import { BcxInput } from "./BcxInput";
import { CardFoilSelector } from "./CardFoilSelector";
import { CardPPInfo } from "./CardPPInfo";
import { CardRaritySelector } from "./CardRaritySelector";
import { CardElementSelector } from "./ElementSelector";
import { SetSelector } from "./SetSelector";

type Props = {
  index: number; // 0..4 (displayed as 1..5)
  value: SlotInput;
  plot: PlotModifiers;
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
      <Box display={"flex"} flexDirection={"row"} gap={1}>
        <Box
          width={100}
          display="flex"
          justifyContent="center"
          alignItems="center"
          textAlign="center"
        >
          <Typography variant="subtitle1">{index + 1}</Typography>
        </Box>
        <SetSelector value={value.set} onChange={onSelect("set")} />
        <CardRaritySelector
          value={value.rarity}
          onChange={onSelect("rarity")}
        />
        <CardFoilSelector value={value.foil} onChange={onSelect("foil")} />
        <CardElementSelector
          value={value.element}
          deedType={plot.deedType}
          onChange={onSelect("element")}
        />
        <BcxInput
          slot={value}
          onChange={(bcx) => onChange({ ...value, bcx })}
        />
        <CardPPInfo basePP={computed.basePP} boostedPP={computed.boostedPP} />
      </Box>
    </Box>
  );
}
