"use client";

import { usePrices } from "@/hooks/usePrices";
import { getDailySPSRatio } from "@/lib/backend/actions/region/sps-actions";
import {
  calcProductionInfo,
  calcTotalPP,
} from "@/lib/frontend/utils/plannerCalcs";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import { PlotPlannerData, SlotInput } from "@/types/planner";
import {
  DeedChange,
  DeedFilterOptions,
  PlaygroundCard,
  PlaygroundDeed,
} from "@/types/playground";
import { PlaygroundSummary } from "@/types/playgroundOutput";
import { Prices } from "@/types/price";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, Pagination, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import DeedGridHeader from "./DeedGridHeader";
import DeedGridRow from "./DeedGridRow";
import ExportButtons from "./ExportButtons";
import PlaygroundFilter from "./PlaygroundFilter";
import PlaygroundOverview from "./PlaygroundOverview";

const ITEMS_PER_PAGE = 50;

type PlaygroundDeedGridProps = {
  deeds: PlaygroundDeed[];
  cards: PlaygroundCard[];
  cardDetails: SplCardDetails[];
  playerName: string | null;
};

export default function PlaygroundDeedGrid({
  deeds,
  cards,
  cardDetails,
  playerName,
}: PlaygroundDeedGridProps) {
  const [changes, setChanges] = useState<DeedChange[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [filterOptions, setFilterOptions] = useState<DeedFilterOptions>({
    regions: [],
    tracts: [],
    plots: [],
  });
  const [spsRatio, setSpsRatio] = useState<number>(0);
  const { prices } = usePrices();

  // Fetch SPS ratio on mount
  useEffect(() => {
    const fetchSpsRatio = async () => {
      try {
        const ratio = await getDailySPSRatio();
        setSpsRatio(ratio);
      } catch (err) {
        console.error("Failed to fetch SPS ratio:", err);
      }
    };
    fetchSpsRatio();
  }, []);

  const handleDeedChange = (change: DeedChange) => {
    setChanges((prev) => [...prev, change]);
  };

  // Apply filters
  const filteredDeeds = useMemo(() => {
    let filtered = deeds;

    if (filterOptions.regions.length > 0) {
      filtered = filtered.filter((d) =>
        filterOptions.regions.includes(d.region_number)
      );
    }

    if (filterOptions.tracts.length > 0) {
      filtered = filtered.filter((d) =>
        filterOptions.tracts.includes(d.tract_number)
      );
    }

    if (filterOptions.plots.length > 0) {
      filtered = filtered.filter((d) =>
        filterOptions.plots.includes(d.plot_number)
      );
    }

    return filtered;
  }, [deeds, filterOptions]);

  // Create updated deeds with changes applied
  const updatedDeeds = useMemo((): PlaygroundDeed[] => {
    return applyChangesToDeeds(deeds, changes);
  }, [deeds, changes]);

  // Calculate original outputs
  const originalOutputs = useMemo(
    (): PlaygroundSummary => calculateSummary(deeds, prices, spsRatio),
    [deeds, prices, spsRatio]
  );

  // Calculate updated outputs
  const updatedOutputs = useMemo(
    (): PlaygroundSummary => calculateSummary(updatedDeeds, prices, spsRatio),
    [updatedDeeds, prices, spsRatio]
  );

  // Get paginated deeds
  const paginatedDeeds = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredDeeds.slice(start, end);
  }, [filteredDeeds, currentPage]);

  // Get available cards (not currently assigned to any deed)
  const availableCards = useMemo(() => {
    const deedWorkers = new Map<string, Set<string>>();

    // Initialize with persisted deed assignments from ALL deeds
    deeds.forEach((deed) => {
      const workers = new Set<string>();
      [
        deed.worker1Uid,
        deed.worker2Uid,
        deed.worker3Uid,
        deed.worker4Uid,
        deed.worker5Uid,
      ].forEach((slotInput) => {
        if (slotInput?.uid) {
          workers.add(slotInput.uid);
        }
      });
      deedWorkers.set(deed.deed_uid, workers);
    });

    // Apply pending changes to get final state
    changes.forEach((change) => {
      if (change.field.startsWith("worker")) {
        const workers = deedWorkers.get(change.deed_uid);
        if (workers) {
          // Handle oldValue - remove the old card from assigned set
          if (change.oldValue) {
            const oldUid =
              typeof change.oldValue === "string"
                ? change.oldValue
                : (change.oldValue as SlotInput).uid;
            if (oldUid) {
              workers.delete(oldUid);
            }
          }
          // Handle newValue - add the new card to assigned set
          if (change.newValue) {
            const newUid =
              typeof change.newValue === "string"
                ? change.newValue
                : (change.newValue as SlotInput).uid;
            if (newUid) {
              workers.add(newUid);
            }
          }
        }
      }
    });

    const assignedCardIds = new Set<string>();
    deedWorkers.forEach((workers) => {
      workers.forEach((uid) => assignedCardIds.add(uid));
    });

    return cards.filter((card) => !assignedCardIds.has(card.uid));
  }, [cards, deeds, changes]);

  const totalPages = Math.ceil(filteredDeeds.length / ITEMS_PER_PAGE);

  const handleExportOriginal = () => {
    const csvContent = generateDeedCSV(deeds);
    downloadCSV(csvContent, "original_deeds.csv");
  };

  const handleExportChanges = () => {
    const csvContent = generateChangesCSV(changes);
    downloadCSV(csvContent, "deed_changes.csv");
  };

  const handleExportNew = () => {
    const csvContent = generateDeedCSV(updatedDeeds);
    downloadCSV(csvContent, "updated_deeds.csv");
  };

  return (
    <Box mt={2} sx={{ width: "100%" }}>
      {/* Overview */}
      <Box sx={{ width: "100%" }}>
        <PlaygroundOverview
          deeds={updatedDeeds}
          originalOutputs={originalOutputs}
          updatedOutputs={updatedOutputs}
          playerName={playerName}
          allCards={cards}
        />
      </Box>

      {/* Export Buttons */}
      <ExportButtons
        onExportOriginal={handleExportOriginal}
        onExportChanges={handleExportChanges}
        onExportNew={handleExportNew}
        changesCount={changes.length}
      />

      {/* Filter */}
      <Box width={"100%"}>
        <PlaygroundFilter
          deeds={deeds}
          filterOptions={filterOptions}
          onFilterChange={setFilterOptions}
        />
      </Box>

      {/* Pagination */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          my: 2,
          maxWidth: "80%",
        }}
      >
        <Pagination
          count={totalPages}
          page={currentPage + 1}
          onChange={(_, page) => setCurrentPage(page - 1)}
          color="primary"
        />
      </Box>

      {/* Grid with horizontal scroll */}
      <Box
        sx={{
          overflowX: "auto",
          width: "100%",
          maxWidth: "100%",
          maxHeight: "70vh",
          borderRadius: 1,
          backgroundColor: "background.paper",
        }}
      >
        <Box
          sx={{
            minWidth: "100%",
            maxWidth: "1200px",
          }}
        >
          {/* Header */}
          <DeedGridHeader />

          {/* Rows */}
          {paginatedDeeds.map((deed) => (
            <DeedGridRow
              key={deed.deed_uid}
              deed={deed}
              availableCards={availableCards.slice(0, 20)}
              allCards={cards}
              cardDetails={cardDetails}
              onChange={handleDeedChange}
            />
          ))}
        </Box>
      </Box>

      {/* Bottom Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <Pagination
          count={totalPages}
          page={currentPage + 1}
          onChange={(_, page) => setCurrentPage(page - 1)}
          color="primary"
        />
        <Typography variant="body2" sx={{ ml: 2, alignSelf: "center" }}>
          Showing {paginatedDeeds.length} of {filteredDeeds.length} deeds
        </Typography>
      </Box>
    </Box>
  );
}

// Helper functions
function applyChangesToDeeds(
  deeds: PlaygroundDeed[],
  changes: DeedChange[]
): PlaygroundDeed[] {
  const changesMap = new Map<string, DeedChange[]>();
  changes.forEach((change) => {
    const existing = changesMap.get(change.deed_uid) || [];
    existing.push(change);
    changesMap.set(change.deed_uid, existing);
  });

  return deeds.map((deed) => {
    const deedChanges = changesMap.get(deed.deed_uid);
    if (!deedChanges) return deed;

    let worksite = deed.worksiteType;
    let runi = deed.runi;
    let title = deed.titleTier;
    let totem = deed.totemTier;
    let worker1 = deed.worker1Uid;
    let worker2 = deed.worker2Uid;
    let worker3 = deed.worker3Uid;
    let worker4 = deed.worker4Uid;
    let worker5 = deed.worker5Uid;

    deedChanges.forEach((change) => {
      if (change.field === "worksite") worksite = change.newValue as string;
      if (change.field === "runi") runi = change.newValue as string;
      if (change.field === "title") title = change.newValue as string;
      if (change.field === "totem") totem = change.newValue as string;
      if (change.field === "worker1")
        worker1 = change.newValue as SlotInput | null;
      if (change.field === "worker2")
        worker2 = change.newValue as SlotInput | null;
      if (change.field === "worker3")
        worker3 = change.newValue as SlotInput | null;
      if (change.field === "worker4")
        worker4 = change.newValue as SlotInput | null;
      if (change.field === "worker5")
        worker5 = change.newValue as SlotInput | null;
    });

    return {
      ...deed,
      worksiteType: worksite,
      runi,
      titleTier: title,
      totemTier: totem,
      worker1Uid: worker1,
      worker2Uid: worker2,
      worker3Uid: worker3,
      worker4Uid: worker4,
      worker5Uid: worker5,
    };
  });
}

function calculateSummary(
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

function generateDeedCSV(deeds: PlaygroundDeed[]): string {
  const headers = [
    "Deed UID",
    "Region",
    "Tract",
    "Plot",
    "Rarity",
    "Status",
    "Type",
    "Worksite",
    "Runi",
    "Title",
    "Totem",
  ];
  const rows = deeds.map((deed) => [
    deed.deed_uid,
    deed.region_number,
    deed.tract_number,
    deed.plot_number,
    deed.rarity,
    deed.plotStatus,
    deed.deedType,
    deed.worksiteType,
    deed.runi || "",
    deed.titleTier || "",
    deed.totemTier || "",
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function generateChangesCSV(changes: DeedChange[]): string {
  const headers = ["Deed UID", "Field", "Old Value", "New Value", "Timestamp"];
  const rows = changes.map((change) => [
    change.deed_uid,
    change.field,
    String(change.oldValue || ""),
    String(change.newValue || ""),
    change.timestamp.toISOString(),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
