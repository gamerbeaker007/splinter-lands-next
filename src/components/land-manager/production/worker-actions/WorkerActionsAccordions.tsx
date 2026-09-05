"use client";

import AuthorityControl from "@/components/land-manager/production/rental-actions/AuthorityControl";
import { UseAuthorityStatus } from "@/hooks/useAuthorityStatusCore";
import { UseWorkerAction } from "@/hooks/useWorkerAction";
import { formatFixed } from "@/lib/formatters";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { foilLabel } from "@/lib/utils/cardUtil";
import {
  BUY_STRATEGY_LABELS,
  BuyConfig,
  LandManagerConfigSection,
  RENTAL_STRATEGY_LABELS,
  RentalConfig,
} from "@/types/landManager";
import {
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Storefront as StorefrontIcon,
} from "@mui/icons-material";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

function RentalConfigChips({
  rental,
  openConfigDialog,
}: {
  rental: RentalConfig;
  openConfigDialog: (section?: LandManagerConfigSection) => void;
}) {
  const chips: { key: string; label: string }[] = [
    { key: "strategy", label: RENTAL_STRATEGY_LABELS[rental.strategy] },
    {
      key: "batch",
      label:
        rental.rental_batch_size === null
          ? "Batch: all plots"
          : `Batch: ${rental.rental_batch_size} plots`,
    },
  ];
  if (rental.max_total_dec > 0)
    chips.push({
      key: "total",
      label: `<= ${formatFixed(rental.max_total_dec)} DEC total per plot`,
    });
  if (rental.max_dec_per_day_per_worker > 0)
    chips.push({
      key: "rate",
      label: `<= ${formatFixed(rental.max_dec_per_day_per_worker)} DEC/day per worker`,
    });
  if (rental.min_land_base_pp > 0)
    chips.push({ key: "pp", label: `>= ${rental.min_land_base_pp} PP` });
  if (rental.min_foil > 0)
    chips.push({ key: "foil", label: `${foilLabel(rental.min_foil)} Foil+` });

  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center" mb={1}>
      <IconButton
        size="small"
        onClick={() => openConfigDialog("rental")}
        sx={{ mb: 1 }}
      >
        <SettingsIcon fontSize="small" />
      </IconButton>
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Config:
      </Typography>
      {chips.map(({ key, label }) => (
        <Chip key={key} label={label} size="small" variant="outlined" />
      ))}
    </Stack>
  );
}

function BuyConfigChips({
  buy,
  openConfigDialog,
}: {
  buy: BuyConfig;
  openConfigDialog: (section?: LandManagerConfigSection) => void;
}) {
  const chips: { key: string; label: string }[] = [
    { key: "strategy", label: BUY_STRATEGY_LABELS[buy.strategy] },
    { key: "batch", label: `Batch: ${buy.buy_batch_size} plots` },
  ];
  if (buy.max_total_dec > 0)
    chips.push({
      key: "total",
      label: `<= ${formatFixed(buy.max_total_dec)} DEC total`,
    });
  if (buy.max_dec_per_worker > 0)
    chips.push({
      key: "rate",
      label: `<= ${formatFixed(buy.max_dec_per_worker)} DEC per worker`,
    });
  if (buy.min_land_base_pp > 0)
    chips.push({ key: "pp", label: `>= ${buy.min_land_base_pp} PP` });
  if (buy.min_foil > 0)
    chips.push({ key: "foil", label: `${foilLabel(buy.min_foil)} Foil+` });

  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center" mb={1}>
      <IconButton
        size="small"
        onClick={() => openConfigDialog("buy")}
        sx={{ mb: 1, textTransform: "none" }}
      >
        <SettingsIcon fontSize="small" />
      </IconButton>

      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Config:
      </Typography>
      {chips.map(({ key, label }) => (
        <Chip key={key} label={label} size="small" variant="outlined" />
      ))}
    </Stack>
  );
}

interface Props {
  rentalConfig: RentalConfig;
  buyConfig: BuyConfig;
  filteredEligibleCount: number | null;
  rentAction: UseWorkerAction;
  buyAction: UseWorkerAction;
  rentalAuthority: UseAuthorityStatus;
  purchaseAuthority: UseAuthorityStatus;
}

export default function WorkerActionsAccordions({
  rentalConfig,
  buyConfig,
  filteredEligibleCount,
  rentAction,
  buyAction,
  rentalAuthority,
  purchaseAuthority,
}: Props) {
  const { openConfigDialog } = useLandManagerContext();
  const rentalAuthStatus = rentalAuthority.status;
  const purchaseAuthStatus = purchaseAuthority.status;

  const blockedByRentalAuthority = Boolean(
    rentalAuthStatus &&
    !(rentalAuthStatus.serviceConfigured && rentalAuthStatus.authorized)
  );
  const blockedByPurchaseAuthority = Boolean(
    purchaseAuthStatus &&
    !(purchaseAuthStatus.serviceConfigured && purchaseAuthStatus.authorized)
  );

  const rentDisabled =
    rentAction.busy ||
    rentAction.eligiblePlotCount === 0 ||
    blockedByRentalAuthority;
  const buyDisabled =
    buyAction.busy ||
    buyAction.eligiblePlotCount === 0 ||
    blockedByPurchaseAuthority;

  const accordionSx = {
    flex: "1 1 320px",
    minWidth: 280,
    m: 0,
    "&.Mui-expanded": {
      m: 0,
    },
  } as const;

  return (
    <Stack direction="row" flexWrap="wrap" gap={2} alignItems="flex-start">
      <Accordion sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" fontWeight={700}>
            Rental Actions
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <AuthorityControl
            authority={rentalAuthority}
            label="Rental Authority"
            actionNoun="rental"
            opName="sm_market_rent"
          />
          <RentalConfigChips
            rental={rentalConfig}
            openConfigDialog={openConfigDialog}
          />
          <Tooltip
            title={
              blockedByRentalAuthority
                ? "Grant rental authority first (see above)"
                : rentAction.eligiblePlotCount === 0
                  ? "No filtered plots have empty worker slots"
                  : `Find workers for ${filteredEligibleCount ?? "..."} eligible filtered plots`
            }
          >
            <span>
              <Button
                size="small"
                variant="contained"
                color="info"
                disabled={rentDisabled}
                startIcon={
                  rentAction.busy ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <StorefrontIcon fontSize="small" />
                  )
                }
                onClick={() => rentAction.prepareExecution()}
                sx={{ textTransform: "none" }}
              >
                Find Rental Workers
              </Button>
            </span>
          </Tooltip>

          {rentAction.result?.success && (
            <Alert
              severity="success"
              onClose={rentAction.clearResult}
              sx={{ mt: 1 }}
            >
              Rented {rentAction.result.count} card
              {rentAction.result.count === 1 ? "" : "s"} · staked{" "}
              {rentAction.result.stakedCount} · spent{" "}
              {formatFixed(rentAction.result.totalDec)} DEC
            </Alert>
          )}
          {rentAction.result && !rentAction.result.success && (
            <Alert
              severity="warning"
              onClose={rentAction.clearResult}
              sx={{ mt: 1 }}
            >
              Rented {rentAction.result.count} card
              {rentAction.result.count === 1 ? "" : "s"} but staking did not
              complete
            </Alert>
          )}
          {rentAction.error && (
            <Alert
              severity="error"
              onClose={rentAction.clearError}
              sx={{ mt: 1 }}
            >
              {rentAction.error}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion sx={accordionSx}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" fontWeight={700}>
            Purchase Actions
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <AuthorityControl
            authority={purchaseAuthority}
            label="Purchase Authority"
            actionNoun="purchase"
            opName="sm_market_purchase"
          />
          <BuyConfigChips buy={buyConfig} openConfigDialog={openConfigDialog} />
          <Tooltip
            title={
              blockedByPurchaseAuthority
                ? "Grant purchase authority first (see above)"
                : buyAction.eligiblePlotCount === 0
                  ? "No filtered plots have empty worker slots"
                  : `Find workers to buy for ${filteredEligibleCount ?? "..."} eligible filtered plots`
            }
          >
            <span>
              <Button
                size="small"
                variant="contained"
                color="secondary"
                disabled={buyDisabled}
                startIcon={
                  buyAction.busy ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <ShoppingCartIcon fontSize="small" />
                  )
                }
                onClick={() => buyAction.prepareExecution()}
                sx={{ textTransform: "none" }}
              >
                Find Buy Workers
              </Button>
            </span>
          </Tooltip>

          {buyAction.result?.success && (
            <Alert
              severity="success"
              onClose={buyAction.clearResult}
              sx={{ mt: 1 }}
            >
              Bought {buyAction.result.count} card
              {buyAction.result.count === 1 ? "" : "s"} · staked{" "}
              {buyAction.result.stakedCount} · spent{" "}
              {formatFixed(buyAction.result.totalDec)} DEC
            </Alert>
          )}
          {buyAction.result && !buyAction.result.success && (
            <Alert
              severity="warning"
              onClose={buyAction.clearResult}
              sx={{ mt: 1 }}
            >
              Bought {buyAction.result.count} card
              {buyAction.result.count === 1 ? "" : "s"} but staking did not
              complete
            </Alert>
          )}
          {buyAction.error && (
            <Alert
              severity="error"
              onClose={buyAction.clearError}
              sx={{ mt: 1 }}
            >
              {buyAction.error}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}
