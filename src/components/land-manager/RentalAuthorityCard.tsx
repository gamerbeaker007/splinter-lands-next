"use client";

import type { UseRentalAuthorityStatus } from "@/hooks/useRentalAuthorityStatus";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface Props {
  authority: UseRentalAuthorityStatus;
}

/**
 * Inline rental-authority control: one row showing a label, a clickable status
 * chip ("Granted" / "Not Granted"), and an Authorize/Revoke button. Clicking
 * the chip triggers the same action as the button.
 */
export default function RentalAuthorityCard({ authority }: Props) {
  const { status, busy, grant, revoke } = authority;
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);

  const serviceAccount = status?.serviceAccount;
  const authorized = Boolean(status?.authorized);
  const configured = Boolean(status?.serviceConfigured);

  const handle = async (kind: "grant" | "revoke") => {
    setActionError(null);
    setActionInfo(null);
    const r = kind === "grant" ? await grant() : await revoke();
    if (!r.success) {
      setActionError(r.error ?? `${kind} failed.`);
      return;
    }

    const isGrant = kind === "grant";

    if (r.confirmed) {
      setActionInfo(
        isGrant ? "Rental authority granted." : "Rental authority revoked."
      );
    } else {
      setActionInfo(
        `${isGrant ? "Granted" : "Revoked"} on chain — SPL has not reflected it yet.`
      );
    }
  };

  const onClick = () => handle(authorized ? "revoke" : "grant");

  let chipLabel: string;
  let chipColor: "default" | "success" | "warning";
  let tooltip: string;

  if (!status) {
    chipLabel = "Checking…";
    chipColor = "default";
    tooltip = "Reading current rental authorities from Splinterlands.";
  } else if (!configured) {
    chipLabel = "Not configured";
    chipColor = "default";
    tooltip = "Server-side renting is not configured.";
  } else if (authorized) {
    chipLabel = "Granted";
    chipColor = "success";
    tooltip = `@${serviceAccount} can sign sm_market_rent on your behalf. Click to revoke.`;
  } else {
    chipLabel = "Not Granted";
    chipColor = "warning";
    tooltip = `Authorize @${serviceAccount} to rent on your behalf (one active-key signature).`;
  }

  const actionable = configured && !busy && status !== null;

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
        <Typography variant="body2" fontWeight="bold">
          Rental Authority
        </Typography>
        <Tooltip title={tooltip}>
          <span>
            <Chip
              size="small"
              label={chipLabel}
              color={chipColor}
              variant={authorized ? "filled" : "outlined"}
              onClick={actionable ? onClick : undefined}
              clickable={actionable}
              disabled={!actionable}
            />
          </span>
        </Tooltip>
        {configured && (
          <Button
            size="small"
            variant={authorized ? "outlined" : "contained"}
            color={authorized ? "error" : "primary"}
            onClick={onClick}
            disabled={!actionable}
            startIcon={
              busy ? <CircularProgress size={14} color="inherit" /> : undefined
            }
          >
            {authorized ? "Revoke" : "Authorize"}
          </Button>
        )}
      </Stack>
      {actionInfo && (
        <Alert
          severity="success"
          sx={{ mt: 1 }}
          onClose={() => setActionInfo(null)}
        >
          {actionInfo}
        </Alert>
      )}
      {actionError && (
        <Alert
          severity="error"
          sx={{ mt: 1 }}
          onClose={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}
    </Box>
  );
}
