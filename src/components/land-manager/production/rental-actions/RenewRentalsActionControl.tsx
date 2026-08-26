"use client";

import { useRenewRentalsAction } from "@/hooks/useRenewRentalsAction";
import { formatFixed } from "@/lib/formatters";
import { Autorenew } from "@mui/icons-material";
import { Alert, Button, CircularProgress, Stack, Tooltip } from "@mui/material";
import { useEffect } from "react";
import RenewRentalsDialog from "./RenewRentalsDialog";

interface Props {
  username: string;
  onSuccess?: () => void;
  onBusyChange?: (busy: boolean) => void;
}

export default function RenewRentalsActionControl({
  username,
  onSuccess,
  onBusyChange,
}: Props) {
  const renewAction = useRenewRentalsAction({ username, onSuccess });

  useEffect(() => {
    onBusyChange?.(renewAction.busy);
  }, [onBusyChange, renewAction.busy]);

  const notYetTime = renewAction.seasonDaysRemaining >= 7;
  const renewDisabled = renewAction.busy || !renewAction.eligible || notYetTime;

  const getRenewTooltip = () => {
    if (notYetTime) {
      return `Renewal opens when < 7 days remain in the season (${renewAction.seasonDaysRemaining.toFixed(1)}d left)`;
    }
    if (!renewAction.eligible) return "No active rentals to renew";
    return "";
  };

  return (
    <>
      <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
        <Tooltip title={getRenewTooltip()}>
          <span>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              disabled={renewDisabled}
              startIcon={
                renewAction.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Autorenew fontSize="small" />
                )
              }
              onClick={() => renewAction.open()}
            >
              Renew Rentals
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {renewAction.result && (
        <Alert
          severity="success"
          onClose={renewAction.clearResult}
          sx={{ mt: 1 }}
        >
          Renewed {renewAction.result.renewedCount} rental
          {renewAction.result.renewedCount === 1 ? "" : "s"} for{" "}
          {formatFixed(renewAction.result.totalDec)} DEC.
        </Alert>
      )}
      {renewAction.error && (
        <Alert severity="error" onClose={renewAction.clearError} sx={{ mt: 1 }}>
          {renewAction.error}
        </Alert>
      )}

      {renewAction.plan && (
        <RenewRentalsDialog
          plan={renewAction.plan}
          busy={renewAction.busy}
          onConfirm={() => renewAction.execute(renewAction.plan!)}
          onCancel={() => renewAction.clearPlan()}
        />
      )}
    </>
  );
}
