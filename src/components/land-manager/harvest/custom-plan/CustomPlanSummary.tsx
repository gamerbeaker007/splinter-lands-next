import {
  CustomPlanRowValidation,
  MAX_OPS_PER_BROADCAST,
} from "@/types/landManager";
import { Layers, PlayArrow } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Fragment, ReactNode } from "react";

interface Props {
  /** The plan picker / name, shown as the card's title. */
  planControl: ReactNode;
  isDirty: boolean;
  /** Validation of every configured row, in plan order. */
  rowValidations: CustomPlanRowValidation[];
  multiplierText: string;
  multiplierValid: boolean;
  onMultiplierChange: (text: string) => void;
  canExecute: boolean;
  /** Why Execute is disabled; shown as its tooltip. */
  executeDisabledReason: string;
  executing: boolean;
  onExecute: () => void;
}

interface Stat {
  key: string;
  text: string;
  color: string;
}

function planStats(rows: CustomPlanRowValidation[]): Stat[] {
  const ready = rows.filter((r) => r.valid && !r.skipped).length;
  const skipped = rows.filter((r) => r.skipped).length;
  const attention = rows.filter((r) => !r.valid).length;
  const signatures = Math.ceil((ready + attention) / MAX_OPS_PER_BROADCAST);

  const stats: Stat[] = [
    {
      key: "actions",
      text: `${rows.length} ${rows.length === 1 ? "action" : "actions"}`,
      color: "text.secondary",
    },
  ];
  if (ready > 0)
    stats.push({ key: "ready", text: `${ready} ready`, color: "success.main" });
  if (skipped > 0)
    stats.push({
      key: "skipped",
      text: `${skipped} skipped`,
      color: "warning.main",
    });
  if (attention > 0)
    stats.push({
      key: "attention",
      text: `${attention} need attention`,
      color: "error.main",
    });
  if (signatures > 0)
    stats.push({
      key: "signatures",
      text: `${signatures} ${signatures === 1 ? "signature" : "signatures"} required`,
      color: "text.secondary",
    });
  return stats;
}

const sectionDivider = (
  <Divider
    orientation="vertical"
    flexItem
    sx={{ display: { xs: "none", md: "block" } }}
  />
);

/** Plan overview: plan picker, row counts, multiplier and the Execute button. */
export default function CustomPlanSummary({
  planControl,
  isDirty,
  rowValidations,
  multiplierText,
  multiplierValid,
  onMultiplierChange,
  canExecute,
  executeDisabledReason,
  executing,
  onExecute,
}: Props) {
  const stats = planStats(rowValidations);

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        bgcolor: "background.paper",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        sx={{ flex: "1 1 280px", minWidth: 0 }}
      >
        <Layers color="primary" sx={{ fontSize: 36 }} />
        <Box minWidth={0}>
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
            mb={0.5}
          >
            {planControl}
            {isDirty && (
              <Chip
                size="small"
                variant="outlined"
                color="warning"
                label="Unsaved"
              />
            )}
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
            {stats.map((stat, i) => (
              <Fragment key={stat.key}>
                {i > 0 && (
                  <Typography component="span" color="text.disabled">
                    ·
                  </Typography>
                )}
                <Typography variant="body2" color={stat.color}>
                  {stat.text}
                </Typography>
              </Fragment>
            ))}
          </Stack>
        </Box>
      </Stack>

      {sectionDivider}

      <TextField
        size="small"
        label="Multiplier"
        value={multiplierText}
        onChange={(e) => onMultiplierChange(e.target.value)}
        sx={{ width: 130 }}
        inputProps={{ inputMode: "decimal" }}
        error={!multiplierValid}
        helperText={!multiplierValid ? "Must be > 0" : "Scales row inputs"}
      />

      {sectionDivider}

      <Tooltip title={executeDisabledReason}>
        <span>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={onExecute}
            disabled={!canExecute}
            startIcon={
              executing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PlayArrow />
              )
            }
          >
            {executing ? "Executing…" : "Execute"}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
}
