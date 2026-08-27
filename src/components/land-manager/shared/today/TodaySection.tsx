"use client";

import { Cancel, CheckCircle } from "@mui/icons-material";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";
import { useTodayTx } from "./TodayTxContext";
import TxList from "./TxList";

interface TodaySectionProps {
  title: string;
  /** Omit for sections the log does not count runs for (the worker flows). */
  runs?: number;
  /** Every tx the section covers — drives both the status icons and the list. */
  txIds: string[];
  children?: ReactNode;
}

/**
 * The frame every Today section shares: a caption with the run count, the
 * aggregate on-chain status, the section's own body, then its transactions.
 */
export default function TodaySection({
  title,
  runs,
  txIds,
  children,
}: TodaySectionProps) {
  const { allVerified, anyFailed } = useTodayTx();

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
        <Typography variant="body1" fontWeight={600} color="text.secondary">
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {runs != null && ` · ${runs} run${runs !== 1 ? "s" : ""}`}
        </Typography>
        {anyFailed(txIds) && (
          <Cancel sx={{ fontSize: 12, color: "error.main" }} />
        )}
        {allVerified(txIds) && (
          <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
        )}
      </Stack>
      {children}
      <TxList txIds={txIds} />
      <Divider />
    </Box>
  );
}
