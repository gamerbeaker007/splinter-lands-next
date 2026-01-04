import {
  calcTotalPP,
  calcProductionInfo,
} from "@/lib/frontend/utils/plannerCalcs";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import { PlotPlannerData, SlotInput } from "@/types/planner";
import { PlaygroundDeed } from "@/types/playground";
import { PlaygroundSummary } from "@/types/playgroundOutput";
import { Prices } from "@/types/price";

export function calculateSummary(
  deeds: PlaygroundDeed[],
  pricesData: Prices | null,
  spsRatio: number
): PlaygroundSummary {
  const perResource: Record<
    string,
    { pp: number; produced: number; consumed: number; net: number }
  > = {};
  let totalBasePP = 0;
  let totalBoostedPP = 0;
  let totalNetDEC = 0;

  const prices = {
    dec: pricesData?.dec || 0,
    sps: pricesData?.sps || 0,
    grain: pricesData?.grain || 0,
    stone: pricesData?.stone || 0,
    wood: pricesData?.wood || 0,
    essence: pricesData?.essence || 0,
    research: pricesData?.research || 0,
    totems: pricesData?.totems || 0,
  };

  // Initialize all producing resources
  PRODUCING_RESOURCES.forEach((res) => {
    perResource[res] = {
      pp: 0,
      produced: 0,
      consumed: 0,
      net: 0,
    };
  });

  deeds.forEach((deed) => {
    const plotData: PlotPlannerData = {
      regionNumber: deed.region_number,
      tractNumber: deed.tract_number,
      plotStatus: deed.plotStatus,
      plotRarity: deed.rarity,
      magicType: deed.magicType || "",
      deedType: deed.deedType,
      worksiteType: deed.worksiteType,
      cardInput: [
        deed.worker1Uid,
        deed.worker2Uid,
        deed.worker3Uid,
        deed.worker4Uid,
        deed.worker5Uid,
      ].filter((w): w is SlotInput => w !== null),
      runi: deed.runi || "none",
      title: deed.titleTier || "none",
      totem: deed.totemTier || "none",
    };

    //Skip CASTLE and KEEPS
    if (deed.worksiteType === "CASTLE" || deed.worksiteType === "KEEP") {
      return;
    }
    const { totalBasePP: basePP, totalBoostedPP: boostedPP } =
      calcTotalPP(plotData);
    totalBasePP += basePP;
    totalBoostedPP += boostedPP;

    const productionInfo = calcProductionInfo(
      basePP,
      boostedPP,
      plotData,
      prices,
      spsRatio,
      null, // extra regionTax
      null // extra captureRate
    );

    totalNetDEC += productionInfo.netDEC;

    const resource = productionInfo.resource;
    // Add PP to the producing resource
    if (perResource[resource]) {
      perResource[resource].pp += boostedPP;
    }

    // Track consumed resources - each consume adds to that resource's consumed total
    productionInfo.consume?.forEach((c) => {
      if (c?.resource && perResource[c.resource]) {
        perResource[c.resource].consumed += c.amount ?? 0;
      }
    });

    // Track produced resources - each produce adds to that resource's produced total
    productionInfo.produce?.forEach((p) => {
      if (p?.resource && perResource[p.resource]) {
        perResource[p.resource].produced += p.amount ?? 0;
      }
    });
  });

  // Calculate net for each resource
  PRODUCING_RESOURCES.forEach((res) => {
    perResource[res].net =
      perResource[res].produced - perResource[res].consumed;
  });

  return {
    totalBasePP,
    totalBoostedPP,
    perResource,
    totalNetDEC,
  };
}
