"use client";

import type { UseAuthorityStatus } from "@/hooks/useAuthorityStatusCore";
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
  authority: UseAuthorityStatus;
  /** Row label, e.g. "Rental Authority". */
  label: string;
  /** Lowercase noun for messages/tooltips, e.g. "rental" / "purchase". */
  actionNoun: string;
  /** The op the service account signs on the user's behalf, e.g. "sm_market_rent". */
  opName: string;
}

/**
 * Inline authority control: one row showing a label, a clickable status chip
 * ("Granted" / "Not Granted"), and an Authorize/Revoke button. Reused for both
 * rental and purchase authority.
 */
export default function AuthorityControl({
  authority,
  label,
  actionNoun,
  opName,
}: Readonly<Props>) {
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
      setActionInfo(isGrant ? `${label} granted.` : `${label} revoked.`);
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
    tooltip = `Reading current ${actionNoun} authorities from Splinterlands.`;
  } else if (!configured) {
    chipLabel = "Not configured";
    chipColor = "default";
    tooltip = `Server-side ${actionNoun} is not configured.`;
  } else if (authorized) {
    chipLabel = "Granted";
    chipColor = "success";
    tooltip = `@${serviceAccount} can sign ${opName} on your behalf. Click to revoke.`;
  } else {
    chipLabel = "Not Granted";
    chipColor = "warning";
    tooltip = `Authorize @${serviceAccount} to ${actionNoun} on your behalf (one active-key signature).`;
  }

  const actionable = configured && !busy && status !== null;

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
        <Typography variant="body2" fontWeight="bold">
          {label}
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
