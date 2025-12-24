"use client";

import PlayerInput from "@/components/player-overview/PlayerInput";
import { usePlaygroundData } from "@/hooks/usePlaygroundData";
import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  calcProductionInfo,
  calcTotalPP,
} from "@/lib/frontend/utils/plannerCalcs";
import { PlotPlannerData, SlotInput } from "@/types/planner";
import {
  DeedChange,
  DeedFilterOptions,
  PlaygroundDeed,
} from "@/types/playground";
import { PlaygroundSummary } from "@/types/playgroundOutput";
import { SplCardDetails } from "@/types/splCardDetails";
import { WarningAmber } from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  CircularProgress,
  Pagination,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import PlaygroundDeedGrid from "./PlaygroundDeedGrid";
import PlaygroundFilter from "./PlaygroundFilter";
import PlaygroundOverview from "./PlaygroundOverview";

const ITEMS_PER_PAGE = 50;

export default function PlaygroundPageContent() {
  const { setTitle } = usePageTitle();
  const { selectedPlayer } = usePlayer();
  const { data, loading, error } = usePlaygroundData(selectedPlayer);

  const [mounted, setMounted] = useState(false);
  const [cardDetails, setCardDetails] = useState<SplCardDetails[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [changes, setChanges] = useState<DeedChange[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const [filterOptions, setFilterOptions] = useState<DeedFilterOptions>({
    regions: [],
    tracts: [],
    plots: [],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTitle("Land Playground");
  }, [setTitle]);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await getCardDetails();
        setCardDetails(cards);
      } catch (err) {
        console.error("Failed to load card details:", err);
      } finally {
        setLoadingCards(false);
      }
    };
    loadCards();
  }, []);

  // Apply filters
  const filteredDeeds = useMemo(() => {
    if (!data) return [];

    let filtered = data.deeds;

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
  }, [data, filterOptions]);

  const handleDeedChange = (change: DeedChange) => {
    setChanges((prev) => [...prev, change]);
  };

  // Calculate original outputs
  const originalOutputs = useMemo((): PlaygroundSummary => {
    if (!data) {
      return {
        totalBasePP: 0,
        totalBoostedPP: 0,
        perResource: {} as Record<
          string,
          { pp: number; produced: number; consumed: number; net: number }
        >,
        totalNetDEC: 0,
      };
    }

    return calculateSummary(data.deeds, {});
  }, [data]);

  // Calculate updated outputs with changes applied
  const updatedOutputs = useMemo((): PlaygroundSummary => {
    if (!data) {
      return {
        totalBasePP: 0,
        totalBoostedPP: 0,
        perResource: {} as Record<
          string,
          { pp: number; produced: number; consumed: number; net: number }
        >,
        totalNetDEC: 0,
      };
    }

    // Apply changes to deeds
    const changesMap = new Map<string, DeedChange[]>();
    changes.forEach((change) => {
      const existing = changesMap.get(change.deed_uid) || [];
      existing.push(change);
      changesMap.set(change.deed_uid, existing);
    });

    return calculateSummary(data.deeds, Object.fromEntries(changesMap));
  }, [data, changes]);

  const handleExportOriginal = () => {
    if (!data) return;

    const csvContent = generateDeedCSV(data.deeds);
    downloadCSV(csvContent, "original_deeds.csv");
  };

  const handleExportChanges = () => {
    const csvContent = generateChangesCSV(changes);
    downloadCSV(csvContent, "deed_changes.csv");
  };

  const handleExportNew = () => {
    // TODO: Apply changes to deeds and export
    console.log("Export new list not yet implemented");
  };

  const totalPages = Math.ceil(filteredDeeds.length / ITEMS_PER_PAGE);

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted || loading || loadingCards) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!selectedPlayer) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Please select a player to view playground data
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        <WarningAmber sx={{ verticalAlign: "middle", mr: 1 }} />
        THIS IS A PLAYGROUND TOOL FOR TESTING PURPOSES ONLY FOR NOW
        <WarningAmber sx={{ verticalAlign: "middle", mr: 1 }} />
      </Typography>
      <PlayerInput />
      {/* Overview */}
      <PlaygroundOverview
        deeds={filteredDeeds}
        originalOutputs={originalOutputs}
        updatedOutputs={updatedOutputs}
      />

      {/* Export Buttons */}
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportOriginal}
        >
          Export Original
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportChanges}
          disabled={changes.length === 0}
        >
          Export Changes ({changes.length})
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportNew}
        >
          Export New List
        </Button>
      </Box>

      {/* Filter */}
      <PlaygroundFilter
        deeds={data.deeds}
        filterOptions={filterOptions}
        onFilterChange={setFilterOptions}
      />

      {/* Deed Grid */}
      <PlaygroundDeedGrid
        deeds={filteredDeeds}
        allDeeds={data.deeds}
        cards={data.cards}
        cardDetails={cardDetails}
        changes={changes}
        onDeedChange={handleDeedChange}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
      />

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={totalPages}
          page={currentPage + 1}
          onChange={(_, page) => setCurrentPage(page - 1)}
          color="primary"
        />
      </Box>

      {/* Stats */}
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Showing {currentPage * ITEMS_PER_PAGE + 1} -{" "}
          {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredDeeds.length)}{" "}
          of {filteredDeeds.length} deeds
        </Typography>
      </Box>
    </Box>
  );
}

// Helper functions for CSV export
function generateDeedCSV(deeds: PlaygroundDeed[]): string {
  const headers = [
    "deed_uid",
    "region",
    "tract",
    "plot",
    "rarity",
    "deedType",
    "resource",
    "worksiteType",
    "basePP",
    "boostedPP",
  ];

  const rows = deeds.map((deed) => [
    deed.deed_uid,
    deed.region_number,
    deed.tract_number,
    deed.plot_number,
    deed.rarity || "",
    deed.deedType || "",
    deed.resource || "",
    deed.worksiteType || "",
    deed.basePP || 0,
    deed.boostedPP || 0,
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

function generateChangesCSV(changes: DeedChange[]): string {
  const headers = ["timestamp", "deed_uid", "field", "old_value", "new_value"];

  const rows = changes.map((change) => [
    change.timestamp.toISOString(),
    change.deed_uid,
    change.field,
    change.oldValue || "",
    change.newValue || "",
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
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

// Helper function to calculate summary
function calculateSummary(
  deeds: PlaygroundDeed[],
  changesMap: Record<string, DeedChange[]>
): PlaygroundSummary {
  const perResource: Record<
    string,
    { pp: number; produced: number; consumed: number; net: number }
  > = {};
  let totalBasePP = 0;
  let totalBoostedPP = 0;
  let totalNetDEC = 0;

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

  deeds.forEach((deed) => {
    // Apply changes if any
    let worksite = deed.worksiteType;
    let runi = deed.runi;
    let title = deed.titleTier;
    let totem = deed.totemTier;
    const workers: (SlotInput | null)[] = [
      deed.worker1Uid,
      deed.worker2Uid,
      deed.worker3Uid,
      deed.worker4Uid,
      deed.worker5Uid,
    ];

    const deedChanges = changesMap[deed.deed_uid];
    if (deedChanges) {
      deedChanges.forEach((change) => {
        if (change.field === "worksite") worksite = change.newValue as string;
        if (change.field === "runi") runi = change.newValue as string;
        if (change.field === "title") title = change.newValue as string;
        if (change.field === "totem") totem = change.newValue as string;
        // Apply worker changes
        if (change.field === "worker1")
          workers[0] = change.newValue as SlotInput | null;
        if (change.field === "worker2")
          workers[1] = change.newValue as SlotInput | null;
        if (change.field === "worker3")
          workers[2] = change.newValue as SlotInput | null;
        if (change.field === "worker4")
          workers[3] = change.newValue as SlotInput | null;
        if (change.field === "worker5")
          workers[4] = change.newValue as SlotInput | null;
      });
    }

    const plotData: PlotPlannerData = {
      regionNumber: deed.region_number,
      tractNumber: deed.tract_number,
      plotStatus: deed.plotStatus,
      plotRarity: deed.rarity,
      magicType: deed.magicType || "",
      deedType: deed.deedType,
      worksiteType: worksite,
      cardInput: workers.filter((w): w is SlotInput => w !== null),
      runi: runi || "none",
      title: title || "none",
      totem: totem || "none",
    };

    try {
      const { totalBasePP: deedBasePP, totalBoostedPP: deedBoostedPP } =
        calcTotalPP(plotData);
      totalBasePP += deedBasePP;
      totalBoostedPP += deedBoostedPP;

      const productionInfo = calcProductionInfo(
        deedBasePP,
        deedBoostedPP,
        plotData,
        prices,
        1,
        null,
        null
      );

      totalNetDEC += productionInfo.netDEC || 0;

      // Aggregate per resource
      productionInfo.produce?.forEach((p) => {
        if (!perResource[p.resource]) {
          perResource[p.resource] = { pp: 0, produced: 0, consumed: 0, net: 0 };
        }
        perResource[p.resource].produced += p.amount;
        perResource[p.resource].pp += deedBoostedPP; // Add PP for this resource
      });

      productionInfo.consume?.forEach((c) => {
        if (!perResource[c.resource]) {
          perResource[c.resource] = { pp: 0, produced: 0, consumed: 0, net: 0 };
        }
        perResource[c.resource].consumed += c.amount;
      });
    } catch (error) {
      console.error(`Error calculating for deed ${deed.deed_uid}:`, error);
    }
  });

  // Calculate net values
  Object.keys(perResource).forEach((resource) => {
    perResource[resource].net =
      perResource[resource].produced - perResource[resource].consumed;
  });

  return {
    totalBasePP,
    totalBoostedPP,
    perResource: perResource as Record<
      string,
      { pp: number; produced: number; consumed: number; net: number }
    >,
    totalNetDEC,
  };
}
