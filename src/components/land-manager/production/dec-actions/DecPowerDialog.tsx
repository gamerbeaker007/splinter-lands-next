"use client";

import {
  DecPowerDirection,
  DecPowerPlan,
} from "@/lib/backend/actions/land-manager/dec-power-actions";
import { DEC_POWER_VARIANTS } from "./decPowerVariant";
import { WarningAmber } from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface Props {
  direction: DecPowerDirection;
  plan: DecPowerPlan;
  decBalance: number | null;
  busy: boolean;
  mode: "dryrun" | "confirm";
  onConfirm?: () => void;
  onClose: () => void;
}

function fmtInt(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

export default function DecPowerDialog({
  direction,
  plan,
  decBalance,
  busy,
  mode,
  onConfirm,
  onClose,
}: Props) {
  const variant = DEC_POWER_VARIANTS[direction];
  const insufficient =
    variant.showBalance && decBalance !== null && decBalance < plan.total_dec;
  const empty = plan.items.length === 0;
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === "dryrun"
          ? `${variant.verb} DEC — Dry Run`
          : `Confirm ${variant.verb} DEC`}
      </DialogTitle>
      <DialogContent dividers>
        {empty ? (
          <Typography variant="body2" color="text.secondary">
            {variant.emptyMessage}
          </Typography>
        ) : (
          <>
            <Stack direction="row" gap={2} flexWrap="wrap" mb={1}>
              <Typography variant="body2">
                <strong>Total to {variant.verb.toLowerCase()}:</strong>{" "}
                {fmtInt(plan.total_dec)} DEC
              </Typography>
              {variant.showBalance && decBalance !== null && (
                <Typography
                  variant="body2"
                  color={insufficient ? "error.main" : "text.secondary"}
                >
                  <strong>Your DEC balance:</strong> {fmtDec(decBalance)}
                </Typography>
              )}
            </Stack>

            {insufficient && (
              <Alert severity="error" icon={<WarningAmber />} sx={{ mb: 1 }}>
                Not enough DEC. Need {fmtInt(plan.total_dec)} but you have{" "}
                {fmtDec(decBalance ?? 0)}. Top up before staking.
              </Alert>
            )}

            {mode === "confirm" && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                <>
                  {variant.gerund} DEC triggers an automatic harvest on the
                  region.
                  <br />
                  If a plot does not have enough resource to cover the harvest,
                  resources will be lost.
                  <br />
                  <br />
                  <strong>Recommend to harvest first.</strong>
                </>
              </Alert>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Region</TableCell>
                  <TableCell align="right">In use</TableCell>
                  <TableCell align="right">Needed</TableCell>
                  <TableCell align="right">{variant.amountHeader}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plan.items.map((it) => (
                  <TableRow key={it.region_uid}>
                    <TableCell>
                      <Typography variant="caption">
                        R{it.region_number}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption">
                        {fmtInt(it.dec_stake_in_use)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption">
                        {fmtInt(it.dec_stake_needed)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color={`${variant.color}.main`}
                      >
                        {fmtInt(it.amount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {mode === "dryrun" ? "Close" : "Cancel"}
        </Button>
        {mode === "confirm" && (
          <Button
            variant="contained"
            color={variant.color}
            onClick={onConfirm}
            disabled={busy || empty || insufficient}
            startIcon={busy ? <CircularProgress size={14} /> : undefined}
          >
            {variant.verb} {fmtInt(plan.total_dec)} DEC
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
