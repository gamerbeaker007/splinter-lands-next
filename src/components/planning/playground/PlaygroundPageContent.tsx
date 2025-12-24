"use client";

import PlayerInput from "@/components/player-overview/PlayerInput";
import { usePlaygroundData } from "@/hooks/usePlaygroundData";
import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  DeedChange,
  DeedFilterOptions,
  PlaygroundDeed,
} from "@/types/playground";
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

  if (!selectedPlayer) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Please select a player to view playground data
        </Typography>
      </Box>
    );
  }

  if (loading || loadingCards) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
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
      <PlaygroundOverview deeds={filteredDeeds} />

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
