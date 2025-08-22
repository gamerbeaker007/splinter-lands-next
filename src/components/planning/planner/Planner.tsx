"use client";
import { getDeedImg } from "@/lib/utils/deedUtil";
import { DeedComplete } from "@/types/deed";
import {
  DEED_BLOCKED,
  DeedType,
  MagicType,
  PlotModifiers,
  PlotRarity,
  PlotStatus,
  RuniTier,
  SlotInput,
  TitleTier,
  TotemTier,
  cardRarityOptions,
  deedTypeOptions,
} from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";
import { Card, Item } from "@/types/stakedAssets";
import { Box, Paper, Stack, Typography } from "@mui/material";
import * as React from "react";
import { useState } from "react";
import SlotEditor from "./card-editor/SlotEditor";
import { PlannerControls } from "./deed-editor/PlanningControls";
import { RuniSelector } from "./RuniSelector";
import { TitleSelector } from "./TitelSelector";
import { TotemSelector } from "./TotemSelector";

const DEFAULTS = {
  set: "Chaos" as SlotInput["set"],
  rarity: "Common" as SlotInput["rarity"],
  bcx: 0,
  foil: "Regular" as SlotInput["foil"],
  element: "Fire" as SlotInput["element"],
};

export type Props = {
  cardDetails: SplCardDetails[];
};

export default function Planner({ cardDetails }: Props) {
  const [plot, setPlot] = useState<PlotModifiers>({
    plotRarity: "Common",
    plotStatus: "Natural",
    deedType: "Badlands",
    title: "None",
    totem: "None",
    runi: "None",
  });
  const [magicType, setMagicType] = useState<MagicType>("");
  const [runiImgUrl, setRuniImgUrl] = useState<string | null>(null);

  const [slots, setSlots] = React.useState<SlotInput[]>(
    Array.from({ length: 5 }).map((_, i) => ({
      id: i + 1,
      set: "Chaos", // default set
      rarity: "Common", // default rarity
      bcx: 0,
      foil: "Regular",
      element: "Fire",
    })),
  );

  const imgUrl = React.useMemo(
    () =>
      getDeedImg(magicType, plot.deedType, plot.plotStatus, plot.plotRarity),
    [magicType, plot.deedType, plot.plotStatus, plot.plotRarity],
  );

  const updatePlot = (patch: Partial<PlotModifiers>) =>
    setPlot((prev) => ({ ...prev, ...patch }));

  const toSlotInput = (card: Card, idx: number): SlotInput => {
    const setName = normalizeEnum(card.card_set ?? "Chaos");
    //TODO fix code here
    const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);
    const rarity = cardRarityOptions[splCard?.rarity - 1 ?? 0];
    const foil = card.foil === 0 ? "Regular" : "Gold";
    console.log(splCard?.color);
    const element = normalizeEnum(splCard?.color ?? "Fire");
    const bcx = card.bcx;

    return {
      id: idx,
      set: setName,
      rarity,
      bcx,
      foil,
      element,
    };
  };
  const updateSlots = (cards: Card[]) => {
    setSlots(() => {
      // take first 5 cards (planner has 5 slots)
      const mapped = cards.slice(0, 5).map((c, i) => toSlotInput(c, i + 1));
      console.log(mapped);
      // pad to length 5 with defaults
      while (mapped.length < 5) {
        const i = mapped.length;
        mapped.push({
          id: i + 1,
          set: DEFAULTS.set,
          rarity: DEFAULTS.rarity,
          bcx: DEFAULTS.bcx,
          foil: DEFAULTS.foil,
          element: DEFAULTS.element,
        });
      }
      return mapped;
    });
  };

  const onRarityChange = (next: PlotRarity) => updatePlot({ plotRarity: next });

  const onPlotStatusChange = (next: PlotStatus) => {
    updatePlot({ plotStatus: next });
    if (next !== "Magical") setMagicType("Fire");
  };

  const onMagicTypeChange = (next: MagicType) => {
    setMagicType(next);
    if (plot.plotStatus === "Magical") {
      const blocked = DEED_BLOCKED[next] ?? [];
      if (blocked.includes(plot.deedType)) {
        const fallback = deedTypeOptions.find((d) => !blocked.includes(d));
        if (fallback) updatePlot({ deedType: fallback });
      }
    }
  };

  const onDeedTypeChange = (next: DeedType) => updatePlot({ deedType: next });

  function findTotem(deed: DeedComplete): TotemTier {
    const items: Item[] = deed.stakedAssets?.items ?? [];
    const totemItem = items.find((i) => i?.stake_type_uid === "STK-LND-TOT");
    if (!totemItem) return "None";

    const raw = totemItem.boost;
    const n = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    if (!Number.isFinite(n)) return "None";

    // normalize to 2 decimals to handle "0.100" etc.
    const b = Math.round(n * 100) / 100;

    switch (b) {
      case 1:
        return "Legendary";
      case 0.5:
        return "Epic";
      case 0.25:
        return "Rare";
      case 0.1:
        return "Common";
      default:
        return "None";
    }
  }

  function findTitle(deed: DeedComplete): TitleTier {
    const items: Item[] = deed.stakedAssets?.items ?? [];
    const titleItem = items.find((i) => i?.stake_type_uid === "STK-LND-TTL");
    if (!titleItem) return "None";

    const raw = titleItem.boost;
    const n = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    if (!Number.isFinite(n)) return "None";

    // normalize to 2 decimals to handle "0.100" etc.
    const b = Math.round(n * 100) / 100;

    switch (b) {
      case 0.5:
        return "Legendary";
      case 0.25:
        return "Epic";
      case 0.1:
        return "Rare";
      default:
        return "None";
    }
  }

  function findRuni(deed: DeedComplete): TitleTier {
    const cards: Card[] = deed.stakedAssets?.cards ?? [];
    const runi = cards.find((i) => i?.stake_type_uid === "STK-LND-RUNI");
    if (!runi) return "None";

    setRuniImgUrl(`https://runi.splinterlands.com/cards/${runi.uid}.jpg`);

    switch (runi.foil) {
      case 0:
        return "Regular";
      case 1:
        return "Gold";
      default:
        return "Regular";
    }
  }

  function normalizeEnum<T extends string>(val: string): T {
    const normalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    return normalized as T;
  }

  function applyImportedDeed(deed: DeedComplete) {
    // Pull fields (adjust names to your real DeedComplete type)
    const importedStatus = normalizeEnum(
      deed.plot_status ?? "Natural",
    ) as PlotStatus;
    const importedRarity = normalizeEnum(deed.rarity ?? "Common") as PlotRarity;
    const importedDeedType = normalizeEnum(deed.deed_type ?? "Bog") as DeedType;
    const importedMagic = normalizeEnum(deed.magic_type ?? "Fire") as MagicType;
    const importedTotem = findTotem(deed);
    const importedTitle = findTitle(deed);
    const importedRuni = findRuni(deed);

    // Update plot first
    updatePlot({
      plotStatus: importedStatus,
      plotRarity: importedRarity,
      deedType: importedDeedType,
      totem: importedTotem,
      title: importedTitle,
      runi: importedRuni,
    });

    updateSlots(deed.stakedAssets?.cards ?? []);

    // Then update magic visual state
    setMagicType(importedStatus === "Magical" ? importedMagic : "");
  }

  const onTotemChange = (tier: TotemTier) => {
    updatePlot({ totem: tier });
  };

  const onTitleChange = (tier: TitleTier) => {
    updatePlot({ title: tier });
  };

  const onRuniChange = (tier: RuniTier) => {
    setRuniImgUrl(null);
    updatePlot({ runi: tier });
  };

  const updateSlot = (i: number, next: SlotInput) =>
    setSlots((s) => s.map((v, idx) => (idx === i ? next : v)));

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <PlannerControls
            value={plot}
            magicType={magicType}
            onRarityChange={onRarityChange}
            onPlotStatusChange={onPlotStatusChange}
            onMagicTypeChange={onMagicTypeChange}
            onDeedTypeChange={onDeedTypeChange}
            applyImportedDeed={applyImportedDeed}
          />
        </Stack>
      </Paper>

      {/* Preview with live background */}
      <Box
        aria-label="Deed preview"
        sx={{
          width: 960,
          height: 510,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          backgroundImage: `url(${imgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
        }}
      >
        <TotemSelector
          value={plot.totem as TotemTier}
          onChange={onTotemChange}
          pos={{ x: "30px", y: "80px" }}
        />

        <TitleSelector
          value={plot.title as TitleTier}
          onChange={onTitleChange}
          pos={{ x: "30px", y: "300px" }}
        />

        <RuniSelector
          value={plot.runi as RuniTier}
          runiImgUrl={runiImgUrl}
          onChange={onRuniChange}
          pos={{ x: "30px", y: "520px" }}
        />

        {slots.map((slot, i) => (
          <SlotEditor
            key={i}
            index={i}
            value={slot}
            plot={plot}
            onChange={(next) => updateSlot(i, next)}
            pos={{ x: `${180 + 60 * i}px`, y: "80px", w: "655px" }}
          />
        ))}

        <Box
          sx={{
            position: "absolute",
            left: 12,
            bottom: 12,
            px: 1,
            py: 0.5,
            bgcolor: "rgba(0,0,0,0.5)",
            borderRadius: 1,
          }}
        >
          {plot.plotStatus !== "magical" ? (
            <Typography variant="caption" color="common.white">
              {`${plot.plotRarity} • ${plot.plotStatus} • ${plot.deedType} •`}
            </Typography>
          ) : (
            <Typography variant="caption" color="common.white">
              {`${plot.plotRarity} • ${plot.plotStatus} • ${magicType} • ${plot.deedType} •`}
            </Typography>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
