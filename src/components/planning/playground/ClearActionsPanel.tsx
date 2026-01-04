"use client";

import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import BusinessIcon from "@mui/icons-material/Business";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import PeopleIcon from "@mui/icons-material/People";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { Box, Button, Tooltip } from "@mui/material";

type ClearActionsPanelProps = {
  filteredDeedsCount: number;
  onClearAll: () => void;
  onClearFiltered: (
    type: "all" | "worksites" | "workers" | "runi" | "titles" | "totems"
  ) => void;
};

export default function ClearActionsPanel({
  filteredDeedsCount,
  onClearAll,
  onClearFiltered,
}: ClearActionsPanelProps) {
  return (
    <Box width={"100%"} display={"flex"} flexDirection={"row"} gap={2} mb={2}>
      <Box
        sx={{
          padding: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          backgroundColor: "background.paper",
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        {/* Clear All Deeds */}
        <Tooltip title="Remove all workers, items, and worksites from all deeds">
          <Button
            onClick={onClearAll}
            variant="contained"
            color="error"
            startIcon={<DeleteSweepIcon />}
            sx={{
              fontWeight: "bold",
              textTransform: "none",
            }}
          >
            Clear All
          </Button>
        </Tooltip>

        {/* Clear All Filtered */}
        <Tooltip title="Remove everything from filtered deeds">
          <Button
            onClick={() => onClearFiltered("all")}
            variant="contained"
            color="warning"
            startIcon={<FilterAltOffIcon />}
            sx={{
              fontWeight: "bold",
              textTransform: "none",
            }}
          >
            Clear Filtered ({filteredDeedsCount})
          </Button>
        </Tooltip>

        {/* Clear Worksites */}
        <Tooltip title="Remove worksites from filtered deeds">
          <Button
            onClick={() => onClearFiltered("worksites")}
            variant="outlined"
            color="warning"
            startIcon={<BusinessIcon />}
            sx={{
              textTransform: "none",
            }}
          >
            Worksites
          </Button>
        </Tooltip>

        {/* Clear Workers */}
        <Tooltip title="Remove all workers from filtered deeds">
          <Button
            onClick={() => onClearFiltered("workers")}
            variant="outlined"
            color="warning"
            startIcon={<PeopleIcon />}
            sx={{
              textTransform: "none",
            }}
          >
            Workers
          </Button>
        </Tooltip>

        {/* Clear Runi */}
        <Tooltip title="Remove Runi from filtered deeds">
          <Button
            onClick={() => onClearFiltered("runi")}
            variant="outlined"
            color="warning"
            startIcon={<AutoFixHighIcon />}
            sx={{
              textTransform: "none",
            }}
          >
            Runi
          </Button>
        </Tooltip>

        {/* Clear Titles */}
        <Tooltip title="Remove titles from filtered deeds">
          <Button
            onClick={() => onClearFiltered("titles")}
            variant="outlined"
            color="warning"
            startIcon={<EmojiEventsIcon />}
            sx={{
              textTransform: "none",
            }}
          >
            Titles
          </Button>
        </Tooltip>

        {/* Clear Totems */}
        <Tooltip title="Remove totems from filtered deeds">
          <Button
            onClick={() => onClearFiltered("totems")}
            variant="outlined"
            color="warning"
            startIcon={<PsychologyIcon />}
            sx={{
              textTransform: "none",
            }}
          >
            Totems
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
}
