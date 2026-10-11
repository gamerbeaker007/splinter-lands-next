"use client";

import { Cancel, CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import { ButtonBase, Link, Popover, Stack, Typography } from "@mui/material";
import { hiveTxIdOf, hiveTxIdsOf } from "@/lib/shared/splTrxIds";
import { useState } from "react";
import { useTodayTx } from "./TodayTxContext";

function txLink(txId: string): string {
  return `https://hivehub.dev/tx/${encodeURIComponent(txId)}`;
}

/**
 * The transactions behind a section, each with its on-chain outcome. The log
 * stores SPL op ids (`<hiveTxId>-N`); they are shown per Hive transaction —
 * the id hivehub knows — which fails if any of its ops failed and is verified
 * once all of them are.
 */
export default function TxList({ txIds: opTxIds }: { txIds: string[] }) {
  const { verifiedTxIds, failedTxIds } = useTodayTx();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (opTxIds.length === 0) return null;

  const txIds = hiveTxIdsOf(opTxIds);
  const opsOf = (txId: string) =>
    opTxIds.filter((opId) => hiveTxIdOf(opId) === txId);
  const failureOf = (txId: string) =>
    opsOf(txId)
      .map((opId) => failedTxIds.get(opId))
      .find((error) => error !== undefined);
  const isVerified = (txId: string) =>
    opsOf(txId).every((opId) => verifiedTxIds.has(opId));

  const hasFailed = txIds.some((txId) => failureOf(txId) !== undefined);
  const allVerified = txIds.every(isVerified);

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
            const failure = failureOf(txId);
            const failed = failure !== undefined;
            const verified = isVerified(txId);

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
                    — {failure}
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
