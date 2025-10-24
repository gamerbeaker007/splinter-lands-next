"use client";
import { determineBcxCap } from "@/lib/utils/cardUtil";
import { getDeedImg } from "@/lib/utils/deedUtil";
import { DeedComplete } from "@/types/deed";
import {
  CardBloodline,
  cardElementColorMap,
  cardFoilOptions,
  cardRarityOptions,
  DeedType,
  deedTypeOptions,
  MagicType,
  PlotPlannerData,
  PlotRarity,
  PlotStatus,
  RuniTier,
  SlotInput,
  TERRAIN_ALLOWED,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "@/types/planner";
import { LowestMarketData } from "@/types/planner/market/market";
import { Prices, SplPriceData } from "@/types/price";
import { ProductionInfo } from "@/types/productionInfo";
import { RegionTax } from "@/types/regionTax";
import { SplCardDetails } from "@/types/splCardDetails";
import { Card, Item } from "@/types/stakedAssets";
import { Box, capitalize, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  calcProductionInfo,
  calcTotalPP,
  calcTotemChancePerHour,
} from "../../../lib/frontend/utils/plannerCalcs";
import SlotEditor from "./card-editor/SlotEditor";
import { PlannerControls } from "./deed-editor/PlanningControls";
import { DECOutput } from "./output/DECOutput";
import ImportedPlotInfo from "./output/ImportedPlotInfo";
import { LandBoostOutput } from "./output/LandBoostOutput";
import PriceOutput from "./output/PriceOutput";
import { ProductionOutput } from "./output/ProductionOutput";
import { ResourceOutput } from "./output/ResourceOutput";
import { RuniSelector } from "./RuniSelector";
import { TitleSelector } from "./TitleSelector";
import { TotemSelector } from "./TotemSelector";
import { WorksiteSelector } from "./WorksiteSelector";
import { Resource } from "@/constants/resource/resource";

const DEFAULTS = {
  set: "chaos" as SlotInput["set"],
  rarity: "common" as SlotInput["rarity"],
  bcx: 0,
  foil: "regular" as SlotInput["foil"],
  element: "fire" as SlotInput["element"],
  bloodline: "Avian" as SlotInput["bloodline"],
};

export type Props = {
  cardDetails: SplCardDetails[];
  prices: Prices;
  tokenPriceData: SplPriceData | null;
  spsRatio: number;
  regionTax: RegionTax[] | null;
  marketData: LowestMarketData | null;
  onPlanChange: (info: ProductionInfo) => void;
};

const fontColor = "common.white";

export default function Planner({
  cardDetails,
  prices,
  tokenPriceData,
  spsRatio,
  regionTax,
  marketData,
  onPlanChange,
}: Props) {
  const [plot, setPlot] = useState<PlotPlannerData>({
    plotRarity: "common",
    plotStatus: "natural",
    deedType: "badlands",
    magicType: "",
    title: "none",
    totem: "none",
    runi: "none",
    worksiteType: "Grain Farm",
    regionNumber: 1,
    tractNumber: 1,
    cardInput: Array.from({ length: 5 }).map((_, i) => ({
      id: i + 1,
      set: "chaos", // default set
      rarity: "common", // default rarity
      bcx: 0,
      foil: "regular",
      element: "fire",
      bloodline: "Avian",
    })),
  });
  const [runiImgUrl, setRuniImgUrl] = useState<string | null>(null);

  const imgUrl = useMemo(
    () =>
      getDeedImg(
        plot.magicType,
        plot.deedType,
        plot.plotStatus,
        plot.plotRarity,
        plot.worksiteType,
      ),
    [
      plot.magicType,
      plot.deedType,
      plot.plotStatus,
      plot.plotRarity,
      plot.worksiteType,
    ],
  );

  const { totalBasePP, totalBoostedPP } = useMemo(
    () => calcTotalPP(plot),
    [plot],
  );

  const captureRate = useMemo(() => {
    const alpha = plot.worksiteType === "KEEP" ? 0.5 : 0.2;
    const denom = plot.worksiteType === "KEEP" ? 5_000 : 10_000;
    if (plot.worksiteType !== "KEEP" && plot.worksiteType !== "CASTLE")
      return null;
    return alpha * (totalBoostedPP / (totalBoostedPP + denom));
  }, [plot.worksiteType, totalBoostedPP]);

  const productionInfo = useMemo(
    () =>
      calcProductionInfo(
        totalBasePP,
        totalBoostedPP,
        plot,
        prices,
        spsRatio,
        regionTax,
        captureRate,
      ),
    [
      totalBasePP,
      totalBoostedPP,
      plot,
      prices,
      spsRatio,
      regionTax,
      captureRate,
    ],
  );

  const totemChance = useMemo(() => {
    return calcTotemChancePerHour(plot.worksiteType, totalBasePP);
  }, [plot.worksiteType, totalBasePP]);

  const [importedPlotLocation, setImportedPlotLocation] = useState<{
    regionNumber: number;
    tractNumber: number;
    plotNumber: number;
    plotId: number;
  } | null>(null);

  useEffect(() => {
    if (onPlanChange) onPlanChange(productionInfo);
  }, [onPlanChange, productionInfo]);

  const updatePlot = (patch: Partial<PlotPlannerData>) =>
    setPlot((prev) => ({ ...prev, ...patch }));

  const toSlotInput = (card: Card, idx: number): SlotInput => {
    const setName = card.card_set ?? "chaos";
    const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);
    const rarity = cardRarityOptions[(splCard?.rarity ?? 0) - 1];
    const foil = card.foil;
    const color = splCard?.color.toLowerCase() ?? "red";
    const element = cardElementColorMap[color];
    const bcx = determineBcxCap(setName, rarity, foil, card.bcx);
    const bloodline = (splCard?.sub_type ?? "Unknown") as CardBloodline;

    return {
      id: idx,
      set: setName,
      rarity,
      bcx,
      foil: cardFoilOptions[foil],
      element,
      bloodline,
      landBoosts: {
        produceBoost: ({} = {} as Record<Resource, number>),
        consumeGrainDiscount: 0,
        bloodlineBoost: 0,
        decDiscount: 0,
        replacePowerCore: false,
        laborLuck: false,
      },
    };
  };
  const updatePlotSlots = (cards: Card[]) => {
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
        bloodline: DEFAULTS.bloodline,
      });
    }

    updatePlot({ cardInput: mapped });
  };

  const onRarityChange = (next: PlotRarity) => updatePlot({ plotRarity: next });

  const onPlotStatusChange = (next: PlotStatus) => {
    updatePlot({ plotStatus: next });

    if (next === "magical") updatePlot({ magicType: "fire" });
  };

  function checkMagicCompatibility(next: MagicType) {
    if (plot.plotStatus !== "magical" || !next) return;

    // Is the current terrain allowed for the selected magic?
    const isAllowed = TERRAIN_ALLOWED[plot.deedType]?.includes(next) ?? false;

    if (isAllowed) return;

    // Find the first terrain that DOES allow this magic
    const fallback =
      deedTypeOptions.find((t) => TERRAIN_ALLOWED[t]?.includes(next)) ??
      plot.deedType; // defensive fallback
    if (fallback !== plot.deedType) {
      updatePlot({ deedType: fallback });
    }
  }

  const onMagicTypeChange = (next: MagicType) => {
    updatePlot({ magicType: next });
    checkMagicCompatibility(next);
  };

  const onDeedTypeChange = (next: DeedType) => updatePlot({ deedType: next });
  const onRegionChange = (next: number) => updatePlot({ regionNumber: next });
  const onTractChange = (next: number) => updatePlot({ tractNumber: next });

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
    const importedWorksite = deed.worksite_type?.trim() || "Grain Farm"; // fallback to grain farm when empty
    const importedTotem = findTotem(deed);
    const importedTitle = findTitle(deed);
    const importedRuni = findRuni(deed);
    const importedRegionNumber = deed.region_number!;
    const importedTractNumber = deed.tract_number!;
    const importedPlotNumber = deed.plot_number!;
    const importedPlotId = deed.plot_id!;

    // Update plot first
    updatePlot({
      plotStatus: importedStatus,
      plotRarity: importedRarity,
      deedType: importedDeedType,
      totem: importedTotem,
      title: importedTitle,
      runi: importedRuni,
      worksiteType: importedWorksite,
      tractNumber: importedTractNumber,
      regionNumber: importedRegionNumber,
    });

    setImportedPlotLocation({
      regionNumber: importedRegionNumber,
      tractNumber: importedTractNumber,
      plotNumber: importedPlotNumber,
      plotId: importedPlotId,
    });

    updatePlotSlots(deed.stakedAssets?.cards ?? []);

    // Then update magic visual state
    updatePlot({
      magicType: importedStatus === "magical" ? importedMagic : "",
    });
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
    updatePlot({
      ...plot,
      cardInput: plot.cardInput.map((v, idx) => (idx === i ? next : v)),
    });
  //

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
            onRarityChange={onRarityChange}
            onPlotStatusChange={onPlotStatusChange}
            onMagicTypeChange={onMagicTypeChange}
            onDeedTypeChange={onDeedTypeChange}
            onRegionChange={onRegionChange}
            onTractChange={onTractChange}
            applyImportedDeed={applyImportedDeed}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <PriceOutput
            plot={plot}
            cardDetails={cardDetails}
            tokenPriceData={tokenPriceData}
            marketData={marketData}
          />
          {importedPlotLocation && (
            <ImportedPlotInfo {...importedPlotLocation} />
          )}
        </Stack>
      </Paper>

      {/* Preview with live background */}
      <Box
        aria-label="Deed preview"
        sx={{
          width: 1056, // Note this matching with the add deed planning button
          height: 561,
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
          pos={{ x: "20px", y: "30px" }}
        />
        <TitleSelector
          value={plot.title as TitleTier}
          onChange={onTitleChange}
          pos={{ x: "170px", y: "30px" }}
        />
        <RuniSelector
          value={plot.runi as RuniTier}
          plotPlannerData={plot}
          runiImgUrl={runiImgUrl}
          onChange={onRuniChange}
          pos={{ x: "295px", y: "30px" }}
        />
        <WorksiteSelector
          value={plot.worksiteType}
          deedType={plot.deedType}
          plotStatus={plot.plotStatus}
          onChange={onWorksiteChange}
          pos={{ x: "20px", y: "90px" }}
        />
        {plot.cardInput.map((slot, i) => (
          <SlotEditor
            key={i}
            index={i}
            value={slot}
            plot={plot}
            onChange={(next) => updateSlot(i, next)}
            pos={{ x: "20px", y: `${200 + 60 * i}px`, w: "740px" }}
          />
        ))}

        <LandBoostOutput
          plotPlannerData={plot}
          pos={{ x: "550px", y: "30px", w: "210px" }}
        />

        <ProductionOutput
          totalBasePP={totalBasePP}
          totalBoostPP={totalBoostedPP}
          captureRate={captureRate ?? undefined}
          totemChance={totemChance ?? undefined}
          pos={{ x: "770px", y: "20px", w: "250px" }}
        />

        <ResourceOutput
          worksiteType={plot.worksiteType}
          productionInfo={productionInfo}
          pos={{ x: "770px", y: "195px" }}
        />
        <DECOutput
          worksiteType={plot.worksiteType}
          productionInfo={productionInfo}
          pos={{ x: "910px", y: "195px" }}
        />

        <Box
          sx={{
            position: "absolute",
            left: 60,
            bottom: 25,
            px: 1,
            bgcolor: "rgba(0,0,0,0.5)",
            borderRadius: 1,
          }}
        >
          {plot.plotStatus !== "magical" ? (
            <Typography variant="caption" color={fontColor}>
              {`${capitalize(plot.plotRarity)} • ${capitalize(plot.plotStatus)} • ${capitalize(plot.deedType)} •`}
            </Typography>
          ) : (
            <Typography variant="caption" color={fontColor}>
              {`${capitalize(plot.plotRarity)} • ${capitalize(plot.plotStatus)} • ${capitalize(plot.magicType)} • ${capitalize(plot.deedType)} •`}
            </Typography>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
