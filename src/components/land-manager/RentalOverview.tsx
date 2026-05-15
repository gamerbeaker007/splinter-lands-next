"use client";

import {
  getRegionAlerts,
  getRentalEligibility,
  RegionAlertInfo,
} from "@/lib/backend/actions/land-manager/rental-actions";
import {
  BIOME_KEYS,
  biomeColorMap,
  biomeIconMap,
  biomeLabelMap,
} from "@/lib/shared/biomeUtils";
import {
  RentalBiomeModifiers,
  RentalEligibilityResult,
  RentalEligiblePlot,
} from "@/types/landManager";
import { Bolt, BoltOutlined } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface Props {
  enabledRegions: number[];
  refreshKey?: number;
}

function BiomeChips({ modifiers }: { modifiers: RentalBiomeModifiers }) {
  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap">
      {BIOME_KEYS.filter((key) => modifiers[key] > 0).map((key) => (
        <Chip
          key={key}
          avatar={
            <Avatar
              src={biomeIconMap[key]}
              alt={biomeLabelMap[key]}
              variant="rounded"
              sx={{
                backgroundColor: biomeColorMap[key],

                // Bigger avatar container
                width: 20,
                height: 20,

                // Smaller icon inside
                "& img": {
                  width: 12,
                  height: 12,
                  objectFit: "contain",
                },
              }}
            />
          }
          label={`+${(modifiers[key] * 100).toFixed(0)}%`}
          size="small"
          variant="outlined"
          sx={{
            fontSize: "0.65rem",
            height: 25,
            "& .MuiChip-avatar": {
              ml: 0.25,
            },
          }}
        />
      ))}
    </Stack>
  );
}

function PlotRow({ plot }: { plot: RentalEligiblePlot }) {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="caption" fontFamily="monospace">
          R{plot.region_number} · T{plot.tract_number} · P{plot.plot_number}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption">{plot.resource_symbol ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" gap={0.5}>
          {plot.is_powered ? (
            <Bolt sx={{ fontSize: 14, color: "warning.main" }} />
          ) : (
            <BoltOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
          )}
          <Typography variant="caption">
            {plot.worker_count} / {plot.max_workers}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Chip
          label={`${plot.empty_slots} empty`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: "0.65rem", height: 18 }}
        />
      </TableCell>
      <TableCell>
        <BiomeChips modifiers={plot.biome_modifiers} />
      </TableCell>
    </TableRow>
  );
}

function PlotTable({
  plots,
  emptyMessage,
}: {
  plots: RentalEligiblePlot[];
  emptyMessage: string;
}) {
  if (plots.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled">
        {emptyMessage}
      </Typography>
    );
  }
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Plot</TableCell>
            <TableCell>Resource</TableCell>
            <TableCell>Workers</TableCell>
            <TableCell>Empty</TableCell>
            <TableCell>Biome boost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {plots.map((p) => (
            <PlotRow key={p.deed_uid} plot={p} />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default function RentalOverview({
  enabledRegions,
  refreshKey = 0,
}: Props) {
  const [data, setData] = useState<RentalEligibilityResult | null>(null);
  const [alerts, setAlerts] = useState<RegionAlertInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getRentalEligibility(enabledRegions),
      getRegionAlerts(enabledRegions),
    ]).then(([d, a]) => {
      if (!cancelled) {
        setData(d);
        setAlerts(a);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabledRegions, refreshKey]);

  if (enabledRegions.length === 0) return null;

  if (loading || data === null) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  const totalEmptyEligible = data.eligible.reduce(
    (sum, p) => sum + p.empty_slots,
    0
  );
  const totalEmptyUnpowered = data.unpoweredSkipped.reduce(
    (sum, p) => sum + p.empty_slots,
    0
  );

  if (data.eligible.length === 0 && data.unpoweredSkipped.length === 0) {
    return null;
  }

  const stakeShortfalls = alerts.filter(
    (a) => a.dec_stake_needed > a.dec_stake_in_use
  );

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" gutterBottom>
          Rental Overview
        </Typography>

        {stakeShortfalls.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="caption" display="block">
              DEC stake shortfall in {stakeShortfalls.length} region
              {stakeShortfalls.length === 1 ? "" : "s"} — these regions need
              more DEC staked before full PP can be earned:
            </Typography>
            <Stack direction="row" gap={0.5} flexWrap="wrap" mt={0.5}>
              {stakeShortfalls.map((r) => (
                <Chip
                  key={r.region_number}
                  label={`R${r.region_number}: +${(r.dec_stake_needed - r.dec_stake_in_use).toLocaleString("en-US", { maximumFractionDigits: 0 })} DEC`}
                  size="small"
                  variant="outlined"
                  color="warning"
                  sx={{ fontSize: "0.65rem", height: 20 }}
                />
              ))}
            </Stack>
          </Alert>
        )}

        <Stack gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Eligible plots — powered with empty worker slots ·{" "}
              {data.eligible.length} plot
              {data.eligible.length === 1 ? "" : "s"} · {totalEmptyEligible}{" "}
              empty slot{totalEmptyEligible === 1 ? "" : "s"}
            </Typography>
            <PlotTable
              plots={data.eligible}
              emptyMessage="No plots with empty worker slots"
            />
          </Box>

          {data.unpoweredSkipped.length > 0 && (
            <Box>
              <Typography variant="caption" color="warning.main" gutterBottom>
                Unpowered plots — skipped · {data.unpoweredSkipped.length} plot
                {data.unpoweredSkipped.length === 1 ? "" : "s"} ·{" "}
                {totalEmptyUnpowered} empty slot
                {totalEmptyUnpowered === 1 ? "" : "s"} (power these to make them
                eligible)
              </Typography>
              <PlotTable
                plots={data.unpoweredSkipped}
                emptyMessage="No unpowered plots"
              />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
