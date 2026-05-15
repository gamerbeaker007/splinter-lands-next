"use client";

import RentConfirmDialog from "@/components/land-manager/bulk-operations/RentConfirmDialog";
import RentDryRunDialog from "@/components/land-manager/bulk-operations/RentDryRunDialog";
import { useRentEmptyWorkersAction } from "@/hooks/useRentEmptyWorkersAction";
import { RentalConfig } from "@/types/landManager";
import { Storefront } from "@mui/icons-material";
import {
  Alert,
  Button,
  ButtonGroup,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  enabledRegions: number[];
  rental: RentalConfig;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => void;
}

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function RentEmptyWorkersRow({
  username,
  enabledRegions,
  rental,
  anyBusy,
  onBusyChange,
  onSuccess,
}: Props) {
  const action = useRentEmptyWorkersAction({
    username,
    rental,
    enabledRegions,
    onSuccess,
  });

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  return (
    <>
      <Stack
        direction="row"
        gap={2}
        flexWrap="wrap"
        alignItems="center"
        mb={1.5}
      >
        <ButtonGroup size="small" disabled={anyBusy}>
          <Button
            variant="contained"
            color="info"
            startIcon={
              action.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <Storefront fontSize="small" />
              )
            }
            onClick={() => action.prepareExecution()}
          >
            Rent Empty Workers
          </Button>
          <Tooltip title="Show planned rentals without broadcasting">
            <Button
              variant="outlined"
              color="info"
              onClick={() => action.preview()}
            >
              Dry Run
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Stack>

      {action.result?.success && (
        <Alert severity="success" onClose={action.clearResult} sx={{ mb: 1 }}>
          Rented {action.result.rentedCount} card
          {action.result.rentedCount === 1 ? "" : "s"} · staked{" "}
          {action.result.stakedCount} · spent {fmtDec(action.result.totalDec)}{" "}
          DEC
        </Alert>
      )}

      {action.result && !action.result.success && (
        <Alert severity="warning" onClose={action.clearResult} sx={{ mb: 1 }}>
          Rented {action.result.rentedCount} card
          {action.result.rentedCount === 1 ? "" : "s"} but staking did not
          complete · {fmtDec(action.result.totalDec)} DEC spent
        </Alert>
      )}

      {action.error && (
        <Alert severity="error" onClose={action.clearError} sx={{ mb: 1 }}>
          {action.error}
        </Alert>
      )}

      {action.dryRunPlan && (
        <RentDryRunDialog
          plan={action.dryRunPlan}
          onClose={action.clearDryRunPlan}
        />
      )}

      {action.executionPlan && (
        <RentConfirmDialog
          exec={action.executionPlan}
          busy={action.busy}
          onConfirm={() => action.execute()}
          onCancel={action.clearExecutionPlan}
        />
      )}
    </>
  );
}
