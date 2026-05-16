"use client";

import {
  getRegionAlerts,
  RegionAlertInfo,
} from "@/lib/backend/actions/land-manager/rental-actions";
import {
  BoltOutlined,
  CheckCircleOutline,
  WarningAmber,
} from "@mui/icons-material";
import {
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

function fmtNum(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function AlertsPanel({ enabledRegions, refreshKey = 0 }: Props) {
  const [data, setData] = useState<RegionAlertInfo[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRegionAlerts(enabledRegions).then((d) => {
      if (!cancelled) {
        setData(d);
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
        <Skeleton variant="rounded" height={100} />
      </Box>
    );
  }
  if (data.length === 0) return null;

  const totalUnpowered = data.reduce((s, r) => s + r.unpowered_plot_count, 0);
  const shortfallByRegion = data.map((r) => ({
    region: r,
    shortfall: Math.max(0, r.dec_stake_needed - r.dec_stake_in_use),
  }));
  const totalShortfall = shortfallByRegion.reduce((s, x) => s + x.shortfall, 0);
  const regionsWithShortfall = shortfallByRegion.filter((x) => x.shortfall > 0);

  // Panel only appears when at least one alert is live. When both checks pass
  // (all plots powered + DEC stake sufficient everywhere), nothing renders.
  if (totalUnpowered === 0 && totalShortfall === 0) return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" gutterBottom>
          Alerts
        </Typography>

        <Stack gap={2}>
          {/* Unpowered plots — only when there are unpowered plots; otherwise
              a small "all clear" line so the user can see the check ran. */}
          {totalUnpowered > 0 ? (
            <Box>
              <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
                <BoltOutlined sx={{ fontSize: 14, color: "warning.main" }} />
                <Typography variant="caption" color="warning.main">
                  Unpowered plots — {totalUnpowered} total
                </Typography>
              </Stack>
              <Stack direction="row" gap={0.5} flexWrap="wrap">
                {data
                  .filter((r) => r.unpowered_plot_count > 0)
                  .map((r) => (
                    <Chip
                      key={r.region_number}
                      label={`R${r.region_number}: ${r.unpowered_plot_count}/${r.total_plot_count}`}
                      size="small"
                      variant="outlined"
                      color="warning"
                      sx={{ fontSize: "0.65rem", height: 20 }}
                    />
                  ))}
              </Stack>
            </Box>
          ) : (
            <Stack direction="row" gap={1} alignItems="center">
              <CheckCircleOutline
                sx={{ fontSize: 14, color: "success.main" }}
              />
              <Typography variant="caption" color="text.secondary">
                All worker plots are powered.
              </Typography>
            </Stack>
          )}

          {/* DEC stake — only when there is at least one shortfall; otherwise
              a small "all clear" line. */}
          {totalShortfall > 0 ? (
            <Box>
              <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
                <WarningAmber sx={{ fontSize: 14, color: "warning.main" }} />
                <Typography variant="caption" color="warning.main">
                  DEC stake shortfall — {fmtNum(totalShortfall)} DEC across{" "}
                  {regionsWithShortfall.length} region
                  {regionsWithShortfall.length === 1 ? "" : "s"}
                </Typography>
              </Stack>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Region</TableCell>
                      <TableCell align="right">In use</TableCell>
                      <TableCell align="right">Needed</TableCell>
                      <TableCell align="right">Shortfall</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {regionsWithShortfall.map(({ region, shortfall }) => (
                      <TableRow key={region.region_number}>
                        <TableCell>
                          <Typography variant="caption">
                            R{region.region_number}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {fmtNum(region.dec_stake_in_use)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {fmtNum(region.dec_stake_needed)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="caption"
                            color="warning.main"
                            fontWeight="bold"
                          >
                            {fmtNum(shortfall)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ) : (
            <Stack direction="row" gap={1} alignItems="center">
              <CheckCircleOutline
                sx={{ fontSize: 14, color: "success.main" }}
              />
              <Typography variant="caption" color="text.secondary">
                DEC stake sufficient in all regions.
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
