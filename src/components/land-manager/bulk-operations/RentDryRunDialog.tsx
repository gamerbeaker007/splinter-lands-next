"use client";

import {
  RentalPlan,
  RentalPlanItem,
  RentalPlanPick,
} from "@/types/landManager";
import { WarningAmber } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  capitalize,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { foilLabel } from "@/lib/utils/cardUtil";
import { cardElementColorMap } from "@/types/planner";

interface Props {
  plan: RentalPlan;
  onClose: () => void;
}

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function PickCard({ pick }: { pick: RentalPlanPick }) {
  return (
    <Stack
      direction="row"
      gap={1.5}
      alignItems="center"
      sx={{
        p: 1,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          width: 70,
          height: 96,
          position: "relative",
          flexShrink: 0,
          bgcolor: "action.hover",
          borderRadius: 0.5,
          overflow: "hidden",
        }}
      >
        <Image
          src={pick.card_image_url}
          alt={pick.card_name}
          fill
          sizes="70px"
          style={{ objectFit: "contain" }}
          unoptimized
        />
      </Box>
      <Stack gap={0.25} flex={1} minWidth={0}>
        <Typography variant="caption" fontWeight="bold">
          {pick.card_name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          lvl {pick.level} ·{" "}
          {capitalize(
            cardElementColorMap[pick.color.toLowerCase()] ?? pick.color
          )}{" "}
          · {foilLabel(pick.foil)} Foil ·{" "}
          {pick.biome_modifier > 0
            ? `+${(pick.biome_modifier * 100).toFixed(0)}% biome`
            : "no biome bonus"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {pick.land_base_pp.toFixed(0)} PP → {pick.effective_pp.toFixed(0)} eff
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {fmtDec(pick.buy_price_per_day)} DEC/day × {pick.rental_days} d ={" "}
          <strong>{fmtDec(pick.total_dec)} DEC</strong>
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontFamily: "monospace", fontSize: "0.65rem" }}
        >
          {pick.pp_per_dec.toFixed(2)} PP/DEC · seller {pick.seller}
        </Typography>
      </Stack>
    </Stack>
  );
}

function PlotBlock({ item }: { item: RentalPlanItem }) {
  return (
    <Box>
      <Stack direction="row" gap={1} alignItems="center" mb={1} flexWrap="wrap">
        <Typography variant="subtitle2" fontFamily="monospace">
          R{item.plot.region_number} · T{item.plot.tract_number} · P
          {item.plot.plot_number}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.plot.resource_symbol ?? "—"}
        </Typography>
        <Chip
          label={`${item.slots_filled}/${item.plot.empty_slots} filled`}
          size="small"
          color={
            item.slots_filled === item.plot.empty_slots
              ? "success"
              : item.slots_filled > 0
                ? "primary"
                : "default"
          }
          variant="outlined"
          sx={{ fontSize: "0.65rem", height: 18 }}
        />
        {item.plot_total_dec > 0 && (
          <Chip
            label={`${fmtDec(item.plot_total_dec)} DEC`}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.65rem", height: 18 }}
          />
        )}
        {item.skip_reason && (
          <Chip
            icon={<WarningAmber sx={{ fontSize: 12 }} />}
            label={item.skip_reason}
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: "0.65rem", height: 18 }}
          />
        )}
      </Stack>
      {item.picks.length === 0 ? (
        <Typography variant="caption" color="text.disabled">
          {item.skip_reason ?? "No picks"}
        </Typography>
      ) : (
        <Stack gap={1}>
          {item.picks.map((pick) => (
            <PickCard key={pick.market_id} pick={pick} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default function RentDryRunDialog({ plan, onClose }: Props) {
  const { totals } = plan;

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Dry Run — Rent Empty Workers</DialogTitle>
      <DialogContent dividers>
        <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
          <Chip
            label={`${totals.plots_with_picks}/${totals.plots_total} plots`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${totals.slots_filled}/${totals.slots_total} slots`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${fmtDec(totals.total_dec)} DEC total`}
            size="small"
            color="primary"
          />
        </Stack>

        {plan.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Stack gap={0.25}>
              {plan.warnings.map((w, i) => (
                <Typography key={i} variant="caption">
                  {w}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        <Stack gap={2} divider={<Divider />}>
          {plan.items.length === 0 ? (
            <Typography variant="body2" color="text.disabled">
              No eligible plots.
            </Typography>
          ) : (
            plan.items.map((item) => (
              <PlotBlock key={item.plot.deed_uid} item={item} />
            ))
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
