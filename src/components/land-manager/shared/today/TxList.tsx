"use client";

import { Cancel, CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { ButtonBase, Link, Popover, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useTodayTx } from "./TodayTxContext";

function txLink(txId: string): string {
  return `https://hivehub.dev/tx/${encodeURIComponent(txId)}`;
}

/** The tx ids behind a section, each with its on-chain outcome. */
export default function TxList({ txIds }: { txIds: string[] }) {
  const { verifiedTxIds, failedTxIds } = useTodayTx();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (txIds.length === 0) return null;

  const hasFailed = txIds.some((txId) => failedTxIds.has(txId));
  const allVerified = txIds.every((txId) => verifiedTxIds.has(txId));

  const summaryIcon = hasFailed ? (
    <Cancel sx={{ fontSize: 14, color: "error.main" }} />
  ) : allVerified ? (
    <CheckCircle sx={{ fontSize: 14, color: "success.main" }} />
  ) : (
    <RadioButtonUnchecked sx={{ fontSize: 14, color: "text.disabled" }} />
  );

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label={`Show ${txIds.length} transaction${txIds.length === 1 ? "" : "s"}`}
        sx={{ borderRadius: 1 }}
      >
        <Stack direction="row" alignItems="center" gap={0.5}>
          {summaryIcon}
          <Typography variant="caption" color="text.secondary">
            {txIds.length} TX{txIds.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </ButtonBase>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack gap={0.5} p={1}>
          {txIds.map((txId) => {
            const failed = failedTxIds.has(txId);
            const verified = verifiedTxIds.has(txId);

            return (
              <Stack key={txId} direction="row" alignItems="center" gap={0.5}>
                {failed ? (
                  <Cancel sx={{ fontSize: 12, color: "error.main" }} />
                ) : verified ? (
                  <CheckCircle sx={{ fontSize: 12, color: "success.main" }} />
                ) : (
                  <RadioButtonUnchecked
                    sx={{ fontSize: 12, color: "text.disabled" }}
                  />
                )}

                <Link
                  suppressHydrationWarning
                  href={txLink(txId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="caption"
                  color={failed ? "error.main" : "text.primary"}
                  sx={{ fontFamily: "monospace", fontSize: "0.65rem" }}
                >
                  {txId}
                </Link>

                {failed && (
                  <Typography variant="caption" color="error.main">
                    — {failedTxIds.get(txId)}
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
}
