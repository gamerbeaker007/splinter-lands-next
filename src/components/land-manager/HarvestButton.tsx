"use client";

import { getLandPools } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  BroadcastResult,
  broadcastOperations,
} from "@/lib/frontend/splBroadcast";
import { buildRegionHarvestOps } from "@/lib/frontend/harvestOps";
import { shouldApplyFee } from "@/lib/shared/landManagerUtils";
import { SERVICE_FEE_PCT } from "@/types/landManager";
import { SplHarvestableResource } from "@/types/spl/landManager";
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
  regionNumber: number;
  regionName: string;
  harvestable: SplHarvestableResource[];
  canAfford: boolean;
  onSuccess: () => void;
}

type Status = "idle" | "broadcasting" | "done" | "error";

export default function HarvestButton({
  username,
  regionUid,
  regionNumber,
  regionName,
  harvestable,
  canAfford,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<BroadcastResult | null>(null);

  const hasAnything = harvestable.length > 0;
  const applyFee = shouldApplyFee(username, regionNumber);

  const handleHarvest = async () => {
    setStatus("broadcasting");
    setResult(null);

    try {
      const { pools } = await getLandPools();
      const { ops } = buildRegionHarvestOps(
        username,
        {
          region_uid: regionUid,
          region_number: regionNumber,
          name: regionName,
        },
        harvestable,
        pools
      );

      const res = await broadcastOperations(username, ops);
      setResult(res);
      setStatus(res.success ? "done" : "error");
      if (res.success) onSuccess();
    } catch (err) {
      setStatus("error");
      setResult({
        success: false,
        txIds: [],
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
              Harvested{feeLabel} · TX:{" "}
              {result?.txIds?.[result.txIds.length - 1] ?? "confirmed"}
            </Typography>
          ) : (
            <Typography variant="caption">{result?.error}</Typography>
          )}
        </Alert>
      </Collapse>
    </Box>
  );
}
