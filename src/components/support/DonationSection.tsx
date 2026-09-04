"use client";

import {
  DONATION_ACCOUNT,
  DONATION_MEMO,
  SUPPORTED_DONATION_CURRENCIES,
  type DonationCurrency,
} from "@/constants/support";
import {
  getSupportBalances,
  recordHiveTransferDonation,
  recordTokenTransferDonation,
} from "@/lib/backend/actions/support/support-actions";
import { formatFixed } from "@/lib/formatters";
import {
  broadcastOperations,
  KeychainKeyTypes,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  buildHiveTransferOp,
  buildTokenTransferOp,
} from "@/lib/shared/operations/supportOpBuilders";
import {
  dec_icon_url,
  hbd_icon_url,
  hive_icon_url,
  sps_icon_url,
} from "@/lib/shared/statics_icon_urls";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RefreshIcon from "@mui/icons-material/Refresh";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

interface Props {
  username: string | null;
  authLoading: boolean;
  onMessage: (
    msg: string,
    severity?: "success" | "error" | "info" | "warning"
  ) => void;
}

interface Balances {
  dec: number;
  sps: number;
  hive: number;
  hbd: number;
}

const CURRENCY_CONFIG: Record<
  DonationCurrency,
  {
    label: string;
    iconUrl: string;
    precision: number;
    balanceKey: keyof Balances;
  }
> = {
  DEC: { label: "DEC", iconUrl: dec_icon_url, precision: 3, balanceKey: "dec" },
  SPS: { label: "SPS", iconUrl: sps_icon_url, precision: 3, balanceKey: "sps" },
  HIVE: {
    label: "HIVE",
    iconUrl: hive_icon_url,
    precision: 3,
    balanceKey: "hive",
  },
  HBD: { label: "HBD", iconUrl: hbd_icon_url, precision: 3, balanceKey: "hbd" },
};

export default function DonationSection({
  username,
  authLoading,
  onMessage,
}: Props) {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState<DonationCurrency>(
    SUPPORTED_DONATION_CURRENCIES[0]
  );
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currencyConfig = CURRENCY_CONFIG[currency];
  const balanceValue = balances?.[currencyConfig.balanceKey] ?? null;

  const balancesLoading =
    refreshing || (!!username && !authLoading && balances === null);

  // Memoised because the mount effect below depends on it.
  const refreshBalances = useCallback(async () => {
    if (!username) return;
    setRefreshing(true);
    const result = await getSupportBalances();
    setBalances({
      dec: result.dec,
      sps: result.sps,
      hive: result.hive,
      hbd: result.hbd,
    });
    setBalancesError(result.error ?? null);
    setRefreshing(false);
  }, [username]);

  useEffect(() => {
    if (authLoading) return;
    void refreshBalances();
  }, [authLoading, refreshBalances]);

  const validateAmount = (raw: string) => {
    const value = Number.parseFloat(raw);
    if (!raw || Number.isNaN(value)) return "Enter a valid amount";
    if (!Number.isFinite(value)) return "Enter a finite amount";
    if (value <= 0) return "Amount must be greater than zero";
    if (balanceValue !== null && value > balanceValue) {
      return `Insufficient known balance (${formatFixed(balanceValue, currencyConfig.precision)} ${currency})`;
    }
    return null;
  };

  // Derived, not state: keeping it in state made a currency switch validate the
  // new amount against the previously selected currency's balance.
  const amountError = amount.length > 0 ? validateAmount(amount) : null;

  const handleDonate = async () => {
    if (!username) return;

    if (amountError) {
      setConfirmOpen(false);
      return;
    }

    const qty = Number.parseFloat(amount);
    setConfirmOpen(false);
    setPending(true);

    const isSplToken = currency === "DEC" || currency === "SPS";

    try {
      const broadcast = await broadcastOperations(
        username,
        [
          isSplToken
            ? buildTokenTransferOp(username, currency, DONATION_ACCOUNT, qty)
            : buildHiveTransferOp(username, DONATION_ACCOUNT, qty, currency),
        ],
        KeychainKeyTypes.active
      );

      if (!broadcast.success) {
        onMessage(
          broadcast.error ?? "Transaction failed or was cancelled",
          "error"
        );
        return;
      }

      const txId = broadcast.txIds[0];
      if (!txId) {
        onMessage("No transaction ID returned from Keychain", "error");
        return;
      }

      // DEC/SPS settle through the SPL engine, so wait on it the same way every
      // other broadcast in the app does. A wait that times out must not abandon
      // a transfer that did land, and the engine's own rejection reason comes
      // back from the record action below either way — so the wait only paces
      // us, it never decides the outcome.
      // A HIVE/HBD transfer never reaches that engine and nothing in the
      // browser can see it, so its wait happens server-side instead.
      if (isSplToken) {
        await waitForTransactions([txId]).catch(() => {});
      }

      const recordResult = isSplToken
        ? await recordTokenTransferDonation(txId)
        : await recordHiveTransferDonation(txId);

      // The donation is only recorded once the transfer has been confirmed
      // against the chain, so the wallet balance is already settled — one real
      // refresh replaces the old optimistic guess plus timed re-poll.
      if (
        recordResult.status === "success" ||
        recordResult.status === "already_recorded"
      ) {
        setAmount("");
        onMessage(
          `Thank you. ${formatFixed(qty, currencyConfig.precision)} ${currency} was sent to ${DONATION_ACCOUNT}.`,
          "success"
        );
        await refreshBalances();
        return;
      }

      if (recordResult.status === "pending") {
        onMessage(recordResult.message, "info");
        await refreshBalances();
        return;
      }

      onMessage(recordResult.error, "error");
    } catch (err) {
      onMessage(
        err instanceof Error ? err.message : "Donation failed",
        "error"
      );
    } finally {
      setPending(false);
    }
  };

  const balanceText = !username
    ? "Log in to see your balance"
    : balancesLoading
      ? "Loading balance..."
      : balanceValue === null
        ? "Balance unavailable"
        : `Balance: ${formatFixed(balanceValue, currencyConfig.precision)} ${currency}`;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <FavoriteIcon color="error" />
          <Typography variant="h6" fontWeight="bold">
            Donate to Support Ongoing Development
          </Typography>
          {username && (
            <Tooltip title="Refresh balances">
              <span>
                <IconButton
                  size="small"
                  onClick={() => void refreshBalances()}
                  disabled={balancesLoading}
                >
                  {balancesLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Donations are sent directly to <strong>{DONATION_ACCOUNT}</strong>{" "}
          with memo &quot;
          {DONATION_MEMO}&quot;.
        </Typography>

        {balancesError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {balancesError}
          </Alert>
        )}

        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(170px, 1fr) minmax(170px, 1fr) auto",
              },
              gap: 1,
              alignItems: "start",
            }}
          >
            <FormControl size="small" fullWidth>
              <InputLabel id="support-donation-currency-label">
                Currency
              </InputLabel>
              <Select
                labelId="support-donation-currency-label"
                value={currency}
                label="Currency"
                onChange={(event) =>
                  setCurrency(event.target.value as DonationCurrency)
                }
                disabled={pending}
                renderValue={(value) => (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={CURRENCY_CONFIG[value].iconUrl}
                      alt={value}
                      sx={{ width: 20, height: 20 }}
                    />
                    <Typography variant="body2" fontWeight={700}>
                      {value}
                    </Typography>
                  </Box>
                )}
              >
                {SUPPORTED_DONATION_CURRENCIES.map((item) => (
                  <MenuItem key={item} value={item}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        src={CURRENCY_CONFIG[item].iconUrl}
                        alt={item}
                        sx={{ width: 20, height: 20 }}
                      />
                      <Typography variant="body2">{item}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              inputProps={{ min: 0, step: "any" }}
              disabled={!username || pending}
              error={!!amountError}
              helperText={amountError ?? " "}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">{currency}</InputAdornment>
                ),
              }}
            />

            <Tooltip title={!username ? "Log in first to donate." : ""}>
              <span>
                <Button
                  variant="contained"
                  disabled={
                    !username || pending || !!amountError || amount.length === 0
                  }
                  onClick={() => setConfirmOpen(true)}
                  sx={{ minHeight: 40, whiteSpace: "nowrap" }}
                  startIcon={
                    pending ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : undefined
                  }
                >
                  Donate
                </Button>
              </span>
            </Tooltip>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              src={currencyConfig.iconUrl}
              alt={currency}
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="body2" color="text.secondary">
              {balanceText}
            </Typography>
          </Box>
        </Box>

        <Dialog
          open={confirmOpen}
          onClose={() => !pending && setConfirmOpen(false)}
        >
          <DialogTitle>Confirm Donation</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Donate{" "}
              <strong>
                {formatFixed(
                  Number.parseFloat(amount || "0"),
                  currencyConfig.precision
                )}{" "}
                {currency}
              </strong>{" "}
              to <strong>{DONATION_ACCOUNT}</strong>?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleDonate}
              disabled={pending}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
