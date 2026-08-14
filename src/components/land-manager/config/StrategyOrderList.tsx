"use client";

import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

interface Props<T extends string> {
  /** Every strategy that exists, in canonical order. */
  all: T[];
  /** The enabled strategies, in the player's preferred order. */
  strategies: T[];
  labels: Record<T, string>;
  onToggle: (s: T) => void;
  onMove: (s: T, dir: -1 | 1) => void;
}

/**
 * Ordered preferred/fallback strategy picker: enabled strategies first (in the
 * player's order, reorderable), then the disabled ones. The first enabled entry
 * is the preferred strategy; the rest are fallbacks. Unchecked strategies are
 * never used — not even implicitly as a fallback.
 */
export default function StrategyOrderList<T extends string>({
  all,
  strategies,
  labels,
  onToggle,
  onMove,
}: Props<T>) {
  const ordered = [
    ...strategies,
    ...all.filter((s) => !strategies.includes(s)),
  ];

  return (
    <>
      {ordered.map((s) => {
        const enabled = strategies.includes(s);
        return (
          <Stack
            key={s}
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ mb: 0.5 }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={enabled}
                  onChange={() => onToggle(s)}
                  size="small"
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{ color: enabled ? "text.primary" : "text.disabled" }}
                >
                  {labels[s]}
                </Typography>
              }
              sx={{ flex: 1, m: 0 }}
            />
            {enabled && (
              <>
                <Tooltip title="Move up (higher priority)">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => onMove(s, -1)}
                      disabled={strategies.indexOf(s) === 0}
                    >
                      <KeyboardArrowUp fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down (lower priority)">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => onMove(s, 1)}
                      disabled={strategies.indexOf(s) === strategies.length - 1}
                    >
                      <KeyboardArrowDown fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
          </Stack>
        );
      })}
    </>
  );
}
