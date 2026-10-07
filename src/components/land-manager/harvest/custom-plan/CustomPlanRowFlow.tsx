import { renderResourceChip } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { formatNumber } from "@/lib/formatters";
import { SHARES_OUT_DECIMALS } from "@/lib/shared/poolPositionUtils";
import { CustomPlanRowValidation } from "@/types/landManager";
import { ArrowForward } from "@mui/icons-material";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

type Validation = CustomPlanRowValidation | null;

/** Estimated output chip(s) of a row, plus the pool-position share if any. */
export function CustomPlanRowOutput({
  validation,
}: {
  validation: Validation;
}) {
  if (!validation || !validation.estimatedOutputSymbol) return null;

  // `poolSharesOut` is the `shares_out` fraction of the player's own liquidity
  // position, so it doubles as "how much of the position this row withdraws".
  // It is only set on a valid pool withdrawal, which already rules out an empty
  // or fully locked position.
  const poolPct = validation.poolSharesOut
    ? validation.poolSharesOut * 100
    : null;

  return (
    <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
      {renderResourceChip(
        validation.estimatedOutputSymbol as Resource,
        validation.estimatedOutputAmount,
        true
      )}
      {validation.estimatedOutputSymbol2 &&
        validation.estimatedOutputAmount2 != null &&
        renderResourceChip(
          validation.estimatedOutputSymbol2 as Resource,
          validation.estimatedOutputAmount2,
          true
        )}
      {poolPct !== null && (
        <Typography variant="caption" color="text.secondary">
          (
          {formatNumber(poolPct, {
            // A percentage has two fewer decimals than the fraction it came
            // from, so this always shows the full precision actually broadcast.
            maximumFractionDigits: Math.max(0, SHARES_OUT_DECIMALS - 2),
          })}
          % of pool position)
        </Typography>
      )}
    </Stack>
  );
}

/**
 * Compact "input → estimated output" shown on a collapsed row. With
 * `isPoolAction` (pool add / withdraw) pooling puts the resource *and* the DEC in,
 *     so they're split by a divider instead of an arrow.
 */
export function CustomPlanRowSummaryFlow({
  validation,
  isPoolAdd = false,
}: {
  validation: Validation;
  isPoolAdd?: boolean;
}) {
  if (!validation) return null;
  if (validation.skipped) {
    return (
      <Typography variant="body2" color="warning.main">
        Skipped
      </Typography>
    );
  }
  const hasInput =
    !!validation.balanceSymbol && validation.inputAmountAbsolute > 0;
  if (!hasInput && !validation.estimatedOutputSymbol) return null;

  return (
    <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
      {hasInput &&
        renderResourceChip(
          validation.balanceSymbol as Resource,
          validation.inputAmountAbsolute,
          true
        )}
      {validation.estimatedOutputSymbol && (
        <>
          {!hasInput ? null : isPoolAdd ? (
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderRightWidth: 2 }}
            />
          ) : (
            <ArrowForward sx={{ fontSize: 16, color: "text.secondary" }} />
          )}
          <CustomPlanRowOutput validation={validation} />
        </>
      )}
    </Stack>
  );
}

function FlowItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={0.5} minWidth={0}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ minHeight: 24, display: "flex", alignItems: "center" }}>
        {children ?? (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

const FlowArrow = () => (
  <ArrowForward
    sx={{
      fontSize: 16,
      color: "text.secondary",
      display: { xs: "none", sm: "block" },
    }}
  />
);

/** Expanded row strip: balance before → input → balance after | estimate. */
export default function CustomPlanRowFlow({
  validation,
}: {
  validation: Validation;
}) {
  const balanceChip = (amount: number | undefined) =>
    validation?.balanceSymbol && amount != null
      ? renderResourceChip(validation.balanceSymbol as Resource, amount, true)
      : null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={{ xs: 1.5, sm: 2 }}
      flexWrap="wrap"
      sx={{
        mt: 1.5,
        p: 1.25,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <FlowItem label="Balance before">
        {balanceChip(validation?.currentBalance)}
      </FlowItem>
      <FlowArrow />
      <FlowItem label="Input">
        {validation && validation.inputAmountAbsolute > 0
          ? balanceChip(validation.inputAmountAbsolute)
          : null}
      </FlowItem>
      <FlowArrow />
      <FlowItem label="Balance after">
        {balanceChip(validation?.inputBalance)}
      </FlowItem>
      <Divider
        orientation="vertical"
        flexItem
        sx={{ display: { xs: "none", sm: "block" } }}
      />
      <FlowItem label="Estimated result">
        {validation?.skipped ? (
          <Typography variant="body2" color="warning.main">
            Skipped
          </Typography>
        ) : validation?.estimatedOutputSymbol ? (
          <CustomPlanRowOutput validation={validation} />
        ) : null}
      </FlowItem>
    </Stack>
  );
}
