"use client";

import { usePayFees } from "@/hooks/usePayFees";
import {
  recordFeesLog,
  recordHarvestLog,
} from "@/lib/backend/actions/land-manager/log-actions";
import { getLandPools } from "@/lib/backend/actions/land-manager/overview-actions";
import { broadcastHarvest } from "@/lib/frontend/executeHarvestFlow";
import { planDesiredFees } from "@/lib/frontend/feePayment";
import { summarizeHarvestedResources } from "@/lib/frontend/harvestOps";
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
  applyFee: boolean;
  onSuccess: () => void;
}

type Status = "idle" | "broadcasting" | "done" | "error";

interface RunResult {
  txIds: string[];
}

export default function HarvestButton({
  username,
  regionUid,
  regionNumber,
  regionName,
  harvestable,
  canAfford,
  applyFee,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const payFees = usePayFees(username);

  const hasAnything = harvestable.length > 0;

  const handleHarvest = async () => {
    setStatus("broadcasting");
    setRunResult(null);
    setErrorMessage(null);

    const region = {
      region_uid: regionUid,
      region_number: regionNumber,
      name: regionName,
    };
    const harvestableMap = { [regionUid]: harvestable };

    try {
      const { pools } = await getLandPools();

      // ── Phase 1: harvest ──
      const harvestRes = await broadcastHarvest(username, [region]);
      if (!harvestRes.success) {
        setStatus("error");
        setErrorMessage(harvestRes.error ?? "Harvest failed");
        return;
      }
      await recordHarvestLog({
        player: username,
        resources: summarizeHarvestedResources(harvestableMap),
        txIds: harvestRes.txIds,
      }).catch(() => {});

      // ── Phase 2: fees ──
      const desired = planDesiredFees([region], harvestableMap, () => applyFee);
      let feeTxIds: string[] = [];
      let feeError: string | null = null;
      if (desired.length > 0) {
        const fee = await payFees.execute(desired, pools);
        feeTxIds = fee.txIds;
        feeError = fee.feeError;
        await recordFeesLog({
          player: username,
          paidFees: fee.paidFees,
          unpaidFees: fee.unpaidFees,
          feeError: fee.feeError,
          txIds: fee.txIds,
        }).catch(() => {});
      }

      setRunResult({ txIds: [...harvestRes.txIds, ...feeTxIds] });
      if (feeError) {
        setStatus("error");
        setErrorMessage(feeError);
      } else {
        setStatus("done");
      }
      onSuccess();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
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
            disabled={
              !hasAnything ||
              !canAfford ||
              status === "broadcasting" ||
              payFees.busy
            }
            onClick={handleHarvest}
            startIcon={
              status === "broadcasting" || payFees.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <HarvestIcon fontSize="small" />
              )
            }
          >
            {status === "broadcasting" || payFees.busy ? "Sending…" : "Harvest"}
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
              {runResult?.txIds?.at(-1) ?? "confirmed"}
            </Typography>
          ) : (
            <Typography variant="caption">
              {errorMessage ?? "Unknown error"}
            </Typography>
          )}
        </Alert>
      </Collapse>
    </Box>
  );
}
