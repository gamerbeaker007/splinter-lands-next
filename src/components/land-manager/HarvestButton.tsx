"use client";

import { getSwapQuote } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  BroadcastResult,
  broadcastOperations,
  buildFeeTransferOp,
  buildHarvestOp,
} from "@/lib/frontend/splBroadcast";
import {
  HarvestableResource,
  SERVICE_FEE_PCT,
  SERVICE_FEE_RECIPIENT,
  SERVICE_FEE_RECIPIENT_REGION,
} from "@/types/landManager";
import { Agriculture as HarvestIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface Props {
  username: string;
  regionUid: string;
  harvestable: HarvestableResource[];
  canAfford: boolean;
  onSuccess: () => void;
}

type Status = "idle" | "broadcasting" | "done" | "error";

export default function HarvestButton({
  username,
  regionUid,
  harvestable,
  canAfford,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<BroadcastResult | null>(null);

  const hasAnything = harvestable.length > 0;
  // No fee if this player IS the fee recipient
  const applyFee =
    username.toLowerCase() !== SERVICE_FEE_RECIPIENT.toLowerCase();

  const handleHarvest = async () => {
    setStatus("broadcasting");
    setResult(null);

    try {
      const ops: [string, object][] = [buildHarvestOp(username, regionUid)];

      if (applyFee) {
        for (const resource of harvestable) {
          const feeAmount = parseFloat(
            ((resource.amount_claimable * SERVICE_FEE_PCT) / 100).toFixed(3)
          );
          if (feeAmount <= 0) continue;

          const { out_amount_1, out_amount_2 } = await getSwapQuote(
            regionUid,
            resource.token_symbol,
            feeAmount
          );

          ops.push(
            buildFeeTransferOp(
              username,
              regionUid,
              SERVICE_FEE_RECIPIENT_REGION,
              resource.token_symbol,
              feeAmount,
              out_amount_1,
              out_amount_2
            )
          );
        }
      }

      const res = await broadcastOperations(username, ops);
      setResult(res);
      setStatus(res.success ? "done" : "error");
      if (res.success) onSuccess();
    } catch (err) {
      setStatus("error");
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const feeLabel = applyFee && hasAnything ? ` + ${SERVICE_FEE_PCT}% fee` : "";

  return (
    <Box>
      <Tooltip
        title={
          !hasAnything
            ? "Nothing to harvest"
            : !canAfford
              ? "Insufficient resources to cover harvest cost"
              : `Harvest all resources${feeLabel}`
        }
      >
        <span>
          <Button
            variant="contained"
            size="small"
            color={!canAfford && hasAnything ? "warning" : "primary"}
            disabled={!hasAnything || !canAfford || status === "broadcasting"}
            onClick={handleHarvest}
            startIcon={
              status === "broadcasting" ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <HarvestIcon fontSize="small" />
              )
            }
          >
            {status === "broadcasting" ? "Sending…" : "Harvest"}
          </Button>
        </span>
      </Tooltip>

      <Collapse in={status === "done" || status === "error"}>
        <Alert
          severity={status === "done" ? "success" : "error"}
          sx={{ mt: 0.5, py: 0.25, fontSize: "0.72rem" }}
          onClose={() => setStatus("idle")}
        >
          {status === "done" ? (
            <Typography variant="caption">
              Harvested{feeLabel} · TX: {result?.txId ?? "confirmed"}
            </Typography>
          ) : (
            <Typography variant="caption">{result?.error}</Typography>
          )}
        </Alert>
      </Collapse>
    </Box>
  );
}
