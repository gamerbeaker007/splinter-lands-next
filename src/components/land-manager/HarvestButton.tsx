"use client";

import { usePayDonations } from "@/hooks/usePayDonations";
import {
  recordDonationsLog,
  recordHarvestLog,
} from "@/lib/backend/actions/land-manager/log-actions";
import { getLandPools } from "@/lib/backend/actions/land-manager/overview-actions";
import { planDesiredDonations } from "@/lib/frontend/donationPayment";
import { broadcastHarvest } from "@/lib/frontend/executeHarvestFlow";
import { summarizeHarvestedResources } from "@/lib/frontend/harvestOps";
import {
  DEFAULT_DONATION_RECIPIENT,
  DonationConfig,
} from "@/types/landManager";
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
  donation: DonationConfig;
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
  donation,
  onSuccess,
}: Props) {
  const applyDonation =
    donation.enabled &&
    donation.pct > 0 &&
    username.toLowerCase() !== DEFAULT_DONATION_RECIPIENT.toLowerCase();
  const [status, setStatus] = useState<Status>("idle");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const payDonations = usePayDonations(username);

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

      // ── Phase 2: donations ──
      const desired = planDesiredDonations(
        [region],
        harvestableMap,
        () => applyDonation,
        donation.pct
      );
      let donationTxIds: string[] = [];
      let donationError: string | null = null;
      if (desired.length > 0) {
        const donationResult = await payDonations.execute(
          desired,
          pools,
          donation
        );
        donationTxIds = donationResult.txIds;
        donationError = donationResult.donationError;
        await recordDonationsLog({
          player: username,
          paidDonations: donationResult.paidDonations,
          unpaidDonations: donationResult.unpaidDonations,
          donationError: donationResult.donationError,
          txIds: donationResult.txIds,
        }).catch(() => {});
      }

      setRunResult({ txIds: [...harvestRes.txIds, ...donationTxIds] });
      if (donationError) {
        setStatus("error");
        setErrorMessage(donationError);
      } else {
        setStatus("done");
      }
      onSuccess();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const donationLabel =
    applyDonation && hasAnything ? ` + ${donation.pct}% donation` : "";

  return (
    <Box>
      <Tooltip
        title={
          !hasAnything
            ? "Nothing to harvest"
            : !canAfford
              ? "Insufficient resources to cover harvest cost"
              : `Harvest all resources${donationLabel}`
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
              payDonations.busy
            }
            onClick={handleHarvest}
            startIcon={
              status === "broadcasting" || payDonations.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <HarvestIcon fontSize="small" />
              )
            }
          >
            {status === "broadcasting" || payDonations.busy
              ? "Sending…"
              : "Harvest"}
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
              Harvested{donationLabel} · TX:{" "}
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
