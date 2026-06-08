"use client";

import { StakeDecPlan } from "@/lib/backend/actions/land-manager/stake-dec-actions";
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
  plan: StakeDecPlan;
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

export default function StakeDecDialog({
  plan,
  decBalance,
  busy,
  mode,
  onConfirm,
  onClose,
}: Props) {
  const insufficient = decBalance !== null && decBalance < plan.total_dec;
  const empty = plan.items.length === 0;
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === "dryrun" ? "Stake DEC — Dry Run" : "Confirm Stake DEC"}
      </DialogTitle>
      <DialogContent dividers>
        {empty ? (
          <Typography variant="body2" color="text.secondary">
            No DEC stake shortfall in any enabled region. Nothing to stake.
          </Typography>
        ) : (
          <>
            <Stack direction="row" gap={2} flexWrap="wrap" mb={1}>
              <Typography variant="body2">
                <strong>Total to stake:</strong> {fmtInt(plan.total_dec)} DEC
              </Typography>
              {decBalance !== null && (
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
                  Staking DEC triggers an automatic harvest on the region.
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
                  <TableCell align="right">Stake</TableCell>
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
                        color="info.main"
                      >
                        {fmtInt(it.shortfall)}
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
            color="info"
            onClick={onConfirm}
            disabled={busy || empty || insufficient}
            startIcon={busy ? <CircularProgress size={14} /> : undefined}
          >
            Stake {fmtInt(plan.total_dec)} DEC
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
