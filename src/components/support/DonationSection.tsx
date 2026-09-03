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
  type DonationRecordResult,
} from "@/lib/backend/actions/support/support-actions";
import {
  broadcastOperations,
  KeychainKeyTypes,
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
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const [amountError, setAmountError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currencyConfig = CURRENCY_CONFIG[currency];
  const balanceValue = balances?.[currencyConfig.balanceKey] ?? null;

  const balancesLoading =
    refreshing || (!!username && !authLoading && balances === null);

  const applyBalanceResult = useCallback(
    (result: Awaited<ReturnType<typeof getSupportBalances>>) => {
      setBalances({
        dec: result.dec,
        sps: result.sps,
        hive: result.hive,
        hbd: result.hbd,
      });
      setBalancesError(result.error ?? null);
      setRefreshing(false);
    },
    []
  );

  const refreshBalances = useCallback(() => {
    if (!username) return;
    setRefreshing(true);
    void getSupportBalances().then(applyBalanceResult);
  }, [username, applyBalanceResult]);

  useEffect(() => {
    if (!username || authLoading) return;
    void getSupportBalances().then(applyBalanceResult);
  }, [username, authLoading, applyBalanceResult]);

  const validateAmount = useCallback(
    (raw: string) => {
      const value = Number.parseFloat(raw);
      if (!raw || Number.isNaN(value)) return "Enter a valid amount";
      if (!Number.isFinite(value)) return "Enter a finite amount";
      if (value <= 0) return "Amount must be greater than zero";
      if (balanceValue !== null && value > balanceValue) {
        return `Insufficient known balance (${balanceValue.toFixed(currencyConfig.precision)} ${currency})`;
      }
      return null;
    },
    [balanceValue, currencyConfig.precision, currency]
  );

  const onCurrencyChange = (event: SelectChangeEvent<DonationCurrency>) => {
    const next = event.target.value as DonationCurrency;
    setCurrency(next);
    setAmountError(validateAmount(amount));
  };

  const onAmountChange = (value: string) => {
    setAmount(value);
    setAmountError(validateAmount(value));
  };

  const applyOptimisticBalance = useCallback(
    (donatedAmount: number) => {
      setBalances((prev) => {
        if (!prev) return prev;
        const key = currencyConfig.balanceKey;
        const nextValue = Math.max(0, prev[key] - donatedAmount);
        return { ...prev, [key]: nextValue };
      });
    },
    [currencyConfig.balanceKey]
  );

  const scheduleBalanceResync = useCallback(() => {
    refreshBalances();
    setTimeout(() => {
      refreshBalances();
    }, 6000);
  }, [refreshBalances]);

  const openConfirm = () => {
    const err = validateAmount(amount);
    setAmountError(err);
    if (!err) {
      setConfirmOpen(true);
    }
  };

  const handleDonate = async () => {
    if (!username) return;

    const err = validateAmount(amount);
    if (err) {
      setAmountError(err);
      setConfirmOpen(false);
      return;
    }

    const qty = Number.parseFloat(amount);
    setConfirmOpen(false);
    setPending(true);

    try {
      let recordResult: DonationRecordResult | null = null;

      if (currency === "DEC" || currency === "SPS") {
        const broadcast = await broadcastOperations(
          username,
          [buildTokenTransferOp(username, currency, DONATION_ACCOUNT, qty)],
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

        for (let attempt = 0; attempt < 5; attempt++) {
          recordResult = await recordTokenTransferDonation(txId);
          if (recordResult.status !== "pending") break;
          if (attempt < 4) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
          }
        }
      } else {
        const broadcast = await broadcastOperations(
          username,
          [buildHiveTransferOp(username, DONATION_ACCOUNT, qty, currency)],
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

        recordResult = await recordHiveTransferDonation({
          txId,
          currency,
          amount: qty,
        });
      }

      if (!recordResult) {
        onMessage("Unexpected donation recording error", "error");
        return;
      }

      if (
        recordResult.status === "success" ||
        recordResult.status === "already_recorded"
      ) {
        applyOptimisticBalance(qty);
        setAmount("");
        setAmountError(null);
        onMessage(
          `Thank you. ${qty.toFixed(currencyConfig.precision)} ${currency} was sent to ${DONATION_ACCOUNT}.`,
          "success"
        );
        scheduleBalanceResync();
        return;
      }

      if (recordResult.status === "pending") {
        onMessage(recordResult.message, "info");
        scheduleBalanceResync();
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

  const balanceText = useMemo(() => {
    if (!username) return "Log in to see your balance";
    if (balancesLoading) return "Loading balance...";
    if (balanceValue === null) return "Balance unavailable";
    return `Balance: ${balanceValue.toLocaleString(undefined, {
      minimumFractionDigits: currencyConfig.precision,
      maximumFractionDigits: currencyConfig.precision,
    })} ${currency}`;
  }, [
    username,
    balancesLoading,
    balanceValue,
    currencyConfig.precision,
    currency,
  ]);

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
                  onClick={refreshBalances}
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
                onChange={onCurrencyChange}
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
              onChange={(event) => onAmountChange(event.target.value)}
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
                  onClick={openConfirm}
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
                {Number.parseFloat(amount || "0").toFixed(
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
