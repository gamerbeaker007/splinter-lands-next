"use client";

import { renderResourceIcon } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { formatCompactNumber } from "@/lib/formatters";
import { ActionPreviewAmount, ActionPreviewRow } from "@/types/actionPreview";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { alpha, Box, Divider, Stack, Tooltip, Typography } from "@mui/material";

/**
 * What a plan adds up to, one row per strategy.
 *
 * Purely presentational: the rows are produced by the action's own planner
 * (see `actionPreviewRows`), so this can only show what the plan below it
 * actually does. Spend is red and negative, receive is green and positive —
 * the same reading in every action, so DEC that funds a purchase looks like a
 * cost and DEC a pool withdrawal hands back looks like income.
 */
interface Props {
  rows: ActionPreviewRow[];
  /** Shown when the plan turned out to do nothing. */
  emptyText?: string;
}

/** Width of the strategy-name column, so every row's amounts line up. */
const LABEL_WIDTH = 140;

const FONT_SIZE = 14;
const ICON_SIZE = 50;

/**
 * One amount as an icon with its number underneath.
 *
 * The tint does the reading: a block of red tiles is what this strategy costs,
 * a block of green is what it returns. The symbol itself is left to the icon —
 * spelling it out again would cost the width that makes the tiles scannable —
 * so the name lives in the tooltip.
 */
function AmountTile({
  amount,
  spent,
}: {
  amount: ActionPreviewAmount;
  spent: boolean;
}) {
  const color = spent ? "error.main" : "success.main";
  const palette = spent ? "error" : "success";
  return (
    <Tooltip title={amount.symbol}>
      <Stack
        alignItems="center"
        gap={0.25}
        sx={{
          minWidth: 80,
          px: 0.75,
          py: 0.5,
          borderRadius: 1,
          bgcolor: (theme) => alpha(theme.palette[palette].main, 0.1),
        }}
      >
        {renderResourceIcon(amount.symbol as Resource, ICON_SIZE)}
        <Typography
          variant="body2"
          fontSize={FONT_SIZE}
          fontWeight={700}
          sx={{ color, lineHeight: 1.2, whiteSpace: "nowrap" }}
        >
          {spent ? "−" : "+"}
          {formatCompactNumber(amount.amount)}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

function SummaryRow({ row }: { row: ActionPreviewRow }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      gap={0.75}
      sx={{ py: 0.75 }}
    >
      {/* The strategy name is the row's key, not one of its values: uppercase,
          muted and in its own fixed column so it never reads as an amount. */}
      <Typography
        variant="caption"
        sx={{
          minWidth: LABEL_WIDTH,
          maxWidth: LABEL_WIDTH,
          fontSize: FONT_SIZE,
          fontWeight: 700,
          letterSpacing: 0.5,
          color: "text.secondary",
          // borderLeft: 2,
          borderColor: "divider",
          pl: 1,
        }}
      >
        {row.label}
      </Typography>

      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.5}>
        {row.spend.map((a) => (
          <AmountTile key={`spend-${a.symbol}`} amount={a} spent />
        ))}
        {row.spend.length > 0 && row.receive.length > 0 && (
          <ArrowForwardIcon sx={{ fontSize: 20, color: "text.secondary" }} />
        )}
        {row.receive.map((a) => (
          <AmountTile key={`receive-${a.symbol}`} amount={a} spent={false} />
        ))}
      </Stack>

      {row.note && (
        <Typography variant="caption" color="text.secondary">
          {row.note}
        </Typography>
      )}
    </Stack>
  );
}

export default function ActionPlanSummary({ rows, emptyText }: Props) {
  if (rows.length === 0) {
    return emptyText ? (
      <Typography variant="caption" color="text.secondary">
        {emptyText}
      </Typography>
    ) : null;
  }
  return (
    <Box>
      <Stack divider={<Divider flexItem />}>
        {rows.map((row) => (
          <SummaryRow key={row.key} row={row} />
        ))}
      </Stack>
    </Box>
  );
}
