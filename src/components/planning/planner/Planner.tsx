"use client";
import { getDeedImg } from "@/lib/utils/deedUtil";
import { DeedComplete } from "@/types/deed";
import {
  cardElementColorMap,
  cardRarityOptions,
  DEED_BLOCKED,
  DeedType,
  deedTypeOptions,
  MagicType,
  PlotModifiers,
  PlotRarity,
  PlotStatus,
  RuniTier,
  SlotInput,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "@/types/planner";
import { Prices } from "@/types/price";
import { SplCardDetails } from "@/types/splCardDetails";
import { Card, Item } from "@/types/stakedAssets";
import { Box, capitalize, Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import SlotEditor from "./card-editor/SlotEditor";
import { PlannerControls } from "./deed-editor/PlanningControls";
import { PPOutput } from "./output/PPOutput";
import { ResourceOutput } from "./output/ResourceOutput";
import { RuniSelector } from "./RuniSelector";
import { TitleSelector } from "./TitleSelector";
import { TotemSelector } from "./TotemSelector";
import { WorksiteSelector } from "./WorksiteSelector";

const DEFAULTS = {
  set: "chaos" as SlotInput["set"],
  rarity: "common" as SlotInput["rarity"],
  bcx: 0,
  foil: "regular" as SlotInput["foil"],
  element: "fire" as SlotInput["element"],
};

export type Props = {
  cardDetails: SplCardDetails[];
  prices: Prices;
};

export default function Planner({ cardDetails, prices }: Props) {
  const [plot, setPlot] = useState<PlotModifiers>({
    plotRarity: "common",
    plotStatus: "natural",
    deedType: "badlands",
    title: "none",
    totem: "none",
    runi: "none",
    worksiteType: "Grain Farm",
  });
  const [magicType, setMagicType] = useState<MagicType>("");
  const [runiImgUrl, setRuniImgUrl] = useState<string | null>(null);

  const [slots, setSlots] = useState<SlotInput[]>(
    Array.from({ length: 5 }).map((_, i) => ({
      id: i + 1,
      set: "chaos", // default set
      rarity: "common", // default rarity
      bcx: 0,
      foil: "regular",
      element: "fire",
    })),
  );

  const imgUrl = useMemo(
    () =>
      getDeedImg(magicType, plot.deedType, plot.plotStatus, plot.plotRarity),
    [magicType, plot.deedType, plot.plotStatus, plot.plotRarity],
  );

  const updatePlot = (patch: Partial<PlotModifiers>) =>
    setPlot((prev) => ({ ...prev, ...patch }));

  const toSlotInput = (card: Card, idx: number): SlotInput => {
    const setName = card.card_set ?? "chaos";
    const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);
    const rarity = cardRarityOptions[(splCard?.rarity ?? 0) - 1];
    const foil = card.foil === 0 ? "regular" : "gold";
    const color = splCard?.color.toLowerCase() ?? "red";
    const element = cardElementColorMap[color];
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
    if (next !== "magical") setMagicType("fire");
  };

  const onMagicTypeChange = (next: MagicType) => {
    setMagicType(next);
    if (plot.plotStatus === "magical") {
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
    if (!totemItem) return "none";

    const raw = totemItem.boost;
    const n = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    if (!Number.isFinite(n)) return "none";

    // normalize to 2 decimals to handle "0.100" etc.
    const b = Math.round(n * 100) / 100;

    switch (b) {
      case 1:
        return "legendary";
      case 0.5:
        return "epic";
      case 0.25:
        return "rare";
      case 0.1:
        return "common";
      default:
        return "none";
    }
  }

  function findTitle(deed: DeedComplete): TitleTier {
    const items: Item[] = deed.stakedAssets?.items ?? [];
    const titleItem = items.find((i) => i?.stake_type_uid === "STK-LND-TTL");
    if (!titleItem) return "none";

    const raw = titleItem.boost;
    const n = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    if (!Number.isFinite(n)) return "none";

    // normalize to 2 decimals to handle "0.100" etc.
    const b = Math.round(n * 100) / 100;

    switch (b) {
      case 0.5:
        return "legendary";
      case 0.25:
        return "epic";
      case 0.1:
        return "rare";
      default:
        return "none";
    }
  }

  function findRuni(deed: DeedComplete): TitleTier {
    const cards: Card[] = deed.stakedAssets?.cards ?? [];
    const runi = cards.find((i) => i?.stake_type_uid === "STK-LND-RUNI");
    if (!runi) return "none";

    setRuniImgUrl(`https://runi.splinterlands.com/cards/${runi.uid}.jpg`);

    switch (runi.foil) {
      case 0:
        return "regular";
      case 1:
        return "gold";
      default:
        return "gegular";
    }
  }

  function applyImportedDeed(deed: DeedComplete) {
    // Pull fields (adjust names to your real DeedComplete type)
    const importedStatus = deed.plot_status ?? "natural";
    const importedRarity = deed.rarity ?? "common";
    const importedDeedType = deed.deed_type?.toLowerCase() ?? "bog";
    const importedMagic = deed.magic_type ?? "fire";
    const importedWorksite = deed.worksite_type ?? "Grain Farm";
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
      worksiteType: importedWorksite,
    });

    updateSlots(deed.stakedAssets?.cards ?? []);

    // Then update magic visual state
    setMagicType(importedStatus === "magical" ? importedMagic : "");
  }

  const onTotemChange = (tier: TotemTier) => {
    updatePlot({ totem: tier });
  };

  const onTitleChange = (tier: TitleTier) => {
    updatePlot({ title: tier });
  };

  const onWorksiteChange = (worksite: WorksiteType) => {
    updatePlot({ worksiteType: worksite });
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
          pos={{ x: "80px", y: "30px" }}
        />

        <TitleSelector
          value={plot.title as TitleTier}
          onChange={onTitleChange}
          pos={{ x: "230px", y: "30px" }}
        />

        <RuniSelector
          value={plot.runi as RuniTier}
          plotModifiers={plot}
          runiImgUrl={runiImgUrl}
          onChange={onRuniChange}
          pos={{ x: "360px", y: "30px" }}
        />

        <WorksiteSelector
          value={plot.worksiteType}
          onChange={onWorksiteChange}
          pos={{ x: "80px", y: "90px" }}
        />

        {slots.map((slot, i) => (
          <SlotEditor
            key={i}
            index={i}
            value={slot}
            plot={plot}
            onChange={(next) => updateSlot(i, next)}
            pos={{ x: "80px", y: `${180 + 60 * i}px`, w: "655px" }}
          />
        ))}

        <PPOutput
          slots={slots}
          plotModifiers={plot}
          pos={{ x: "780px", y: "50px" }}
        />

        <ResourceOutput
          slots={slots}
          plotModifiers={plot}
          prices={prices}
          pos={{ x: "780px", y: "180px" }}
        />
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
              {`${capitalize(plot.plotRarity)} • ${capitalize(plot.plotStatus)} • ${capitalize(plot.deedType)} •`}
            </Typography>
          ) : (
            <Typography variant="caption" color="common.white">
              {`${capitalize(plot.plotRarity)} • ${capitalize(plot.plotStatus)} • ${capitalize(magicType)} • ${capitalize(plot.deedType)} •`}
            </Typography>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
