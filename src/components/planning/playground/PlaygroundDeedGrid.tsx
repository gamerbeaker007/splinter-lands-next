"use client";

import {
  filterAvailableCards,
  filterDeeds,
} from "@/components/planning/playground/util/deedFilters";
import { usePrices } from "@/hooks/usePrices";
import { getDailySPSRatio } from "@/lib/backend/actions/region/sps-actions";
import { CardFilterOptions } from "@/types/cardFilter";
import {
  DeedChange,
  DeedFilterOptions,
  PlaygroundCard,
  PlaygroundDeed,
} from "@/types/playground";
import { PlaygroundSummary } from "@/types/playgroundOutput";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, Pagination, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import ClearActionsPanel from "./ClearActionsPanel";
import DeedGridHeader from "./DeedGridHeader";
import DeedGridRow from "./DeedGridRow";
import ExportButtons from "./ExportButtons";
import PlaygroundCardFilter from "./PlaygroundCardFilter";
import PlaygroundFilter from "./PlaygroundFilter";
import PlaygroundOverview from "./PlaygroundOverview";
import { calculateSummary } from "./util/calculatedSummary";
import { downloadCSV } from "./util/dowload";

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
  const [updatedDeeds, setUpdatedDeeds] = useState<PlaygroundDeed[]>(deeds);
  const [currentPage, setCurrentPage] = useState(0);
  const [filterOptions, setFilterOptions] = useState<DeedFilterOptions>({
    regions: [],
    tracts: [],
    plots: [],
    rarities: [],
    statuses: [],
    terrains: [],
    worksites: [],
    underConstruction: false,
    developed: false,
    maxWorkers: null,
  });
  const [cardFilterOptions, setCardFilterOptions] = useState<CardFilterOptions>(
    {
      onWagon: undefined,
      inSet: undefined,
      rarities: [],
      sets: [],
      elements: [],
      foils: [],
      minPP: 0,
    }
  );
  const [spsRatio, setSpsRatio] = useState<number>(0);
  const { prices } = usePrices();

  // Reset updatedDeeds when deeds prop changes
  useEffect(() => {
    setUpdatedDeeds(deeds);
  }, [deeds]);

  // Fetch SPS ratio on mount
  useEffect(() => {
    getDailySPSRatio()
      .then(setSpsRatio)
      .catch((err) => console.error("Failed to fetch SPS ratio:", err));
  }, []);

  const handleDeedChange = (change: DeedChange) => {
    setUpdatedDeeds((prev) =>
      prev.map((deed) => {
        if (deed.deed_uid !== change.deed_uid) return deed;

        const fieldMap: Record<string, keyof PlaygroundDeed> = {
          worksite: "worksiteType",
          runi: "runi",
          title: "titleTier",
          totem: "totemTier",
          worker1: "worker1Uid",
          worker2: "worker2Uid",
          worker3: "worker3Uid",
          worker4: "worker4Uid",
          worker5: "worker5Uid",
        };

        const deedField = fieldMap[change.field];
        if (!deedField) return deed;

        return {
          ...deed,
          [deedField]: change.newValue,
        };
      })
    );
  };

  // Apply filters to updatedDeeds
  const filteredDeeds = useMemo(() => {
    return filterDeeds(updatedDeeds, filterOptions);
  }, [updatedDeeds, filterOptions]);

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
  const { availableCards, assignedCardCount } = useMemo(() => {
    // Use updatedDeeds directly - changes are already applied
    const assignedCardIds = new Set<string>();

    updatedDeeds.forEach((deed) => {
      [
        deed.worker1Uid,
        deed.worker2Uid,
        deed.worker3Uid,
        deed.worker4Uid,
        deed.worker5Uid,
      ].forEach((slotInput) => {
        if (slotInput?.uid) {
          assignedCardIds.add(slotInput.uid);
        }
      });
    });

    // Filter out assigned cards and apply card filter options
    const filtered = filterAvailableCards(
      cards,
      assignedCardIds,
      cardFilterOptions
    );

    return {
      availableCards: filtered,
      assignedCardCount: assignedCardIds.size,
    };
  }, [cards, updatedDeeds, cardFilterOptions]);

  const totalPages = Math.ceil(filteredDeeds.length / ITEMS_PER_PAGE);

  const handleExportOriginal = () => {
    const csvContent = generateDeedCSV(deeds);
    downloadCSV(csvContent, "original_deeds.csv");
  };

  const handleExportNew = () => {
    const csvContent = generateDeedCSV(updatedDeeds);
    downloadCSV(csvContent, "updated_deeds.csv");
  };

  const handleClearAllDeeds = () => {
    setUpdatedDeeds((prev) =>
      prev.map((deed) => ({
        ...deed,
        worksiteType: "",
        runi: "none",
        titleTier: "none",
        totemTier: "none",
        worker1Uid: null,
        worker2Uid: null,
        worker3Uid: null,
        worker4Uid: null,
        worker5Uid: null,
      }))
    );
  };

  const handleClearFiltered = (
    type: "all" | "worksites" | "workers" | "runi" | "titles" | "totems"
  ) => {
    const filteredDeedIds = new Set(filteredDeeds.map((d) => d.deed_uid));
    setUpdatedDeeds((prev) =>
      prev.map((deed) => {
        if (!filteredDeedIds.has(deed.deed_uid)) return deed;
        return {
          ...deed,
          worksiteType:
            type === "all" || type === "worksites" ? "" : deed.worksiteType,
          runi: type === "all" || type === "runi" ? "none" : deed.runi,
          titleTier:
            type === "all" || type === "titles" ? "none" : deed.titleTier,
          totemTier:
            type === "all" || type === "totems" ? "none" : deed.totemTier,
          worker1Uid:
            type === "all" || type === "workers" ? null : deed.worker1Uid,
          worker2Uid:
            type === "all" || type === "workers" ? null : deed.worker2Uid,
          worker3Uid:
            type === "all" || type === "workers" ? null : deed.worker3Uid,
          worker4Uid:
            type === "all" || type === "workers" ? null : deed.worker4Uid,
          worker5Uid:
            type === "all" || type === "workers" ? null : deed.worker5Uid,
        };
      })
    );
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
        onExportNew={handleExportNew}
        originalDeeds={deeds}
        updatedDeeds={updatedDeeds}
        allCards={cards}
      />

      {/* Filters */}
      <Box width={"100%"} display={"flex"} flexDirection={"row"} gap={2} mb={2}>
        <PlaygroundFilter
          deeds={deeds}
          filterOptions={filterOptions}
          onFilterChange={setFilterOptions}
        />
        <PlaygroundCardFilter
          cards={cards}
          filteresCardCount={availableCards.length}
          assingesCardCount={assignedCardCount}
          filterOptions={cardFilterOptions}
          onFilterChange={setCardFilterOptions}
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

      {/* Clear Buttons */}
      <ClearActionsPanel
        filteredDeedsCount={filteredDeeds.length}
        onClearAll={handleClearAllDeeds}
        onClearFiltered={handleClearFiltered}
      />

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

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}
