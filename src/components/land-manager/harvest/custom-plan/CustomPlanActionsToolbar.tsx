import { Add, Search, UnfoldLess, UnfoldMore } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

interface Props {
  actionCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  allExpanded: boolean;
  onToggleAll: () => void;
  onAddAction: () => void;
}

/** "Actions (n)" header: search, expand/collapse all and Add action. */
export default function CustomPlanActionsToolbar({
  actionCount,
  search,
  onSearchChange,
  allExpanded,
  onToggleAll,
  onAddAction,
}: Props) {
  return (
    <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
      <Typography variant="h6" component="h3" sx={{ mr: 0.5 }}>
        Actions{" "}
        <Typography component="span" color="text.secondary">
          ({actionCount})
        </Typography>
      </Typography>
      <TextField
        size="small"
        placeholder="Search resources, regions, actions…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flex: "1 1 220px", maxWidth: 520 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
        <Tooltip title={allExpanded ? "Collapse all" : "Expand all"}>
          <span>
            <IconButton
              size="small"
              onClick={onToggleAll}
              disabled={actionCount === 0}
              aria-label={allExpanded ? "Collapse all rows" : "Expand all rows"}
            >
              {allExpanded ? (
                <UnfoldLess fontSize="small" />
              ) : (
                <UnfoldMore fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <Button variant="outlined" startIcon={<Add />} onClick={onAddAction}>
          Add action
        </Button>
      </Box>
    </Stack>
  );
}
