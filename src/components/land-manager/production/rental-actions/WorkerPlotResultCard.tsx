"use client";

import WorkerCardPicksCell, {
  WorkerMode,
} from "@/components/land-manager/production/rental-actions/WorkerCardPicksCell";
import { projectWorkerPlanPlot } from "@/components/land-manager/production/worker-actions/workerScoring";
import { parseLandStatsResources } from "@/lib/filters";
import { formatFixed, formatInt } from "@/lib/formatters";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  dec_icon_url,
  land_castle_icon_url,
  land_keep_icon_url,
  land_unsurveyd_deed_url,
} from "@/lib/shared/statics_icon_urls";
import {
  getDeedImg,
  getDeedRarityIcon,
  getPlotStatusIcon,
} from "@/lib/utils/deedUtil";
import { DeedComplete } from "@/types/deed";
import { WorkerPlanItem, WorkerPlanPlotCard } from "@/types/landManager";
import { Prices } from "@/types/price";
import { RegionTax } from "@/types/regionTax";
import { Alert, Box, Grid, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";

interface Props {
  item: WorkerPlanItem;
  mode: WorkerMode;
  deed: DeedComplete;
  currentWorkers?: WorkerPlanPlotCard[];
  emptySlots: number[];
  prices: Prices | null;
  spsRatio: number;
  regionTax: RegionTax[];
}

// Deed artwork is 800×422; the header keeps that ratio so nothing is cropped.
const DEED_IMAGE_RATIO = "800 / 422";
const CARD_MAX_WIDTH = 600;
// Below this card width the picks no longer fit on the artwork, so they move
// underneath it.
export const WORKER_PLOT_OVERLAY_MIN_WIDTH = 520;

const badgeSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.5,
  px: 0.75,
  py: 0.3,
  borderRadius: 1,
  bgcolor: "rgba(0,0,0,0.75)",
  color: "#fff",
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.4,
} as const;

function BadgeIcon({ src }: { src: string }) {
  return (
    <Box
      component="img"
      src={src}
      alt=""
      sx={{ width: 16, height: 16, objectFit: "contain" }}
    />
  );
}

function PlotArtwork({
  deed,
  children,
}: {
  deed: DeedComplete;
  children?: ReactNode;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = imageFailed
    ? land_unsurveyd_deed_url
    : deed.deed_type
      ? getDeedImg(
          deed.magic_type ?? "",
          deed.deed_type,
          deed.plot_status ?? "",
          deed.rarity ?? "",
          deed.worksite_type ?? undefined
        )
      : land_unsurveyd_deed_url;
  const statusIcon = deed.castle
    ? land_castle_icon_url
    : deed.keep
      ? land_keep_icon_url
      : deed.plot_status
        ? getPlotStatusIcon(deed.plot_status)
        : null;
  const statusLabel = deed.castle
    ? "Castle"
    : deed.keep
      ? "Keep"
      : deed.plot_status;

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: DEED_IMAGE_RATIO,
          overflow: "hidden",
          bgcolor: "grey.900",
        }}
      >
        <Box
          component="img"
          src={src}
          alt={`${deed.rarity ?? "Land"} plot artwork`}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ position: "absolute", top: 8, left: 8, right: 8 }}
        >
          <Box sx={badgeSx}>
            {deed.rarity && <BadgeIcon src={getDeedRarityIcon(deed.rarity)} />}
            {deed.rarity ?? "Unsurveyed"}
          </Box>
          {statusLabel && (
            <Box sx={badgeSx}>
              {statusIcon && <BadgeIcon src={statusIcon} />}
              {statusLabel}
            </Box>
          )}
        </Stack>
        <Box
          sx={{
            position: "absolute",
            inset: "auto 0 0",
            px: 1.5,
            pt: 3,
            pb: 0.75,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)",
            color: "#fff",
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {deed.region_name} #{String(deed.region_number).padStart(3, "0")}-
            {String(deed.tract_number).padStart(3, "0")}-
            {String(deed.plot_number).padStart(3, "0")}
          </Typography>
        </Box>
      </Box>
      {children && (
        <Box
          sx={{
            p: 1,
            bgcolor: "grey.900",
            [`@container (min-width: ${WORKER_PLOT_OVERLAY_MIN_WIDTH}px)`]: {
              position: "absolute",
              top: 100,
              left: 75,
              right: 12,
              p: 0,
              bgcolor: "transparent",
            },
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}

function ResourceRates({
  rates,
  color,
}: {
  rates: Array<{ resource: string; amount: number }>;
  color?: string;
}) {
  const validRates = rates.filter(
    (rate): rate is { resource: string; amount: number } =>
      typeof rate.resource === "string" && rate.resource.trim().length > 0
  );
  if (validRates.length === 0)
    return <Typography variant="body2">—</Typography>;
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {validRates.map(({ resource, amount }) => (
        <Stack key={resource} direction="row" alignItems="center" spacing={0.4}>
          {RESOURCE_ICON_MAP[resource.toUpperCase()] && (
            <Box
              component="img"
              src={RESOURCE_ICON_MAP[resource.toUpperCase()]}
              alt=""
              sx={{ width: 18, height: 18, objectFit: "contain" }}
            />
          )}
          <Typography variant="body2" color={color}>
            {formatFixed(amount, 3)} {resource}/hr
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export default function WorkerPlotResultCard({
  item,
  mode,
  deed,
  currentWorkers,
  emptySlots,
  prices,
  spsRatio,
  regionTax,
}: Readonly<Props>) {
  const projection =
    prices && currentWorkers
      ? projectWorkerPlanPlot(
          deed,
          currentWorkers,
          item.picks,
          emptySlots,
          prices,
          spsRatio,
          regionTax
        )
      : null;
  const resourceValue =
    deed.worksiteDetail?.token_symbol ??
    deed.productionInfo?.resource ??
    parseLandStatsResources(deed.land_stats)[0] ??
    null;
  const resourceSymbol =
    typeof resourceValue === "string" && resourceValue.trim().length > 0
      ? resourceValue
      : null;
  const currentProduced = new Map(
    projection?.current.produce.map((rate) => [rate.resource, rate.amount]) ??
      []
  );
  const productionDelta =
    projection?.next.produce.map((rate) => ({
      resource: rate.resource,
      amount: rate.amount - (currentProduced.get(rate.resource) ?? 0),
    })) ?? [];
  const selectedPPByUid = projection?.selectedPPByUid ?? {};
  const selectedTotalDec = item.picks.reduce(
    (sum, pick) => sum + pick.total_dec,
    0
  );
  const selectedTotalUsd = item.picks.reduce(
    (sum, pick) => sum + pick.total_usd,
    0
  );
  const dailyRentalCost = item.picks.reduce(
    (sum, pick) => sum + (pick.buy_price_per_day ?? 0),
    0
  );
  const periodLabel =
    mode === "rent" &&
    item.picks.every((pick) => pick.rental_days !== undefined)
      ? item.picks.every(
          (pick) => pick.rental_days === item.picks[0]?.rental_days
        )
        ? `${item.picks[0]?.rental_days}-day listing term`
        : "each card's listed rental term"
      : "listed rental terms";
  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: CARD_MAX_WIDTH,
        mx: "auto",
        overflow: "hidden",
        borderColor: "divider",
        containerType: "inline-size",
      }}
      aria-label={`Selected workers for region ${deed.region_number}, tract ${deed.tract_number}, plot ${deed.plot_number}`}
    >
      <PlotArtwork deed={deed}>
        {item.picks.length > 0 ? (
          <WorkerCardPicksCell
            picks={item.picks}
            mode={mode}
            selectedPPByUid={selectedPPByUid}
          />
        ) : (
          <Typography variant="body2" color="white">
            No workers selected for this plot.
          </Typography>
        )}
      </PlotArtwork>
      <Grid container spacing={0}>
        <Grid size={{ xs: 12, md: 5 }} sx={{ p: 1.5 }}>
          <Stack spacing={1}>
            {mode === "rent" ? (
              <Stack spacing={0.25}>
                <Typography variant="body2" fontWeight={700}>
                  Rent Costs: {formatFixed(dailyRentalCost)} DEC/day recurring
                </Typography>
                <CostAmount
                  totalDec={selectedTotalDec}
                  totalUsd={selectedTotalUsd}
                  periodLabel={periodLabel}
                />
              </Stack>
            ) : (
              <>
                <Typography variant="body2" fontWeight={700}>
                  Buy Costs
                </Typography>
                <CostAmount
                  totalDec={selectedTotalDec}
                  totalUsd={selectedTotalUsd}
                />
              </>
            )}
          </Stack>
        </Grid>
        <Grid
          size={{ xs: 12, md: 7 }}
          sx={{
            p: 1.5,
            borderTop: { xs: 1, md: 0 },
            borderLeft: { xs: 0, md: 1 },
            borderColor: "divider",
          }}
        >
          <Stack spacing={0.75}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={800}>
                {deed.worksite_type ?? "No worksite"}
              </Typography>
              {resourceSymbol && (
                <>
                  <Typography variant="subtitle1" fontWeight={800}>
                    ·
                  </Typography>
                  {RESOURCE_ICON_MAP[resourceSymbol.toUpperCase()] && (
                    <Box
                      component="img"
                      src={RESOURCE_ICON_MAP[resourceSymbol.toUpperCase()]}
                      alt=""
                      sx={{ width: 22, height: 22, objectFit: "contain" }}
                    />
                  )}
                  <Typography variant="subtitle1" fontWeight={800}>
                    {resourceSymbol}
                  </Typography>
                </>
              )}
            </Stack>
            {projection ? (
              <Stack spacing={0.6}>
                <Stack direction="row" gap={0.75} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Estimated production:
                  </Typography>
                  <ResourceRates rates={projection.next.produce} />
                </Stack>
                <Stack direction="row" gap={0.75} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Expected increase:
                  </Typography>
                  <ResourceRates rates={productionDelta} color="success.main" />
                </Stack>
                <Stack direction="row" gap={0.5} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Estimated net:
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatFixed(projection.next.netDEC * 24, 3)}
                  </Typography>
                  <Box
                    component="img"
                    src={dec_icon_url}
                    alt="DEC"
                    sx={{ width: 17, height: 17, objectFit: "contain" }}
                  />
                  <Typography variant="caption">/day</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={700} sx={{ pt: 0.25 }}>
                  Plot total: {formatInt(projection.next.basePP)} PP ·{" "}
                  {formatInt(projection.next.boostedPP)} boosted PP
                </Typography>
              </Stack>
            ) : (
              <Alert severity="info" sx={{ py: 0, px: 1 }}>
                Current worker data or prices are unavailable; planner
                production estimate not shown.
              </Alert>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}

function CostAmount({
  totalDec,
  totalUsd,
  periodLabel,
}: {
  totalDec: number;
  totalUsd: number;
  periodLabel?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
      <Typography variant="body2" fontWeight={800}>
        {formatFixed(totalDec)}
      </Typography>
      <Box
        component="img"
        src={dec_icon_url}
        alt="DEC"
        sx={{ width: 18, height: 18, objectFit: "contain" }}
      />
      {periodLabel && (
        <Typography variant="caption" color="text.secondary">
          {periodLabel}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        ≈ {formatFixed(totalUsd, 2)} USD
      </Typography>
    </Stack>
  );
}
