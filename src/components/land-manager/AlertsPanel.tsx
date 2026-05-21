"use client";

import {
  CheckCircleOutline,
  FlashOffOutlined,
  GroupAddOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useLandManagerRegionData } from "../../hooks/useLandManagerRegionData";

interface Props {
  enabledRegions: number[];
  refreshKey?: number;
}

function fmtNum(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function AlertsPanel({ enabledRegions, refreshKey = 0 }: Props) {
  const { eligibility, stakedDEC, loading } = useLandManagerRegionData(
    enabledRegions,
    refreshKey
  );

  if (enabledRegions.length === 0) return null;
  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={100} />
      </Box>
    );
  }

  const shortfallByRegion = stakedDEC.map((r) => ({
    region: r,
    shortfall: Math.max(0, r.dec_stake_needed - r.dec_stake_in_use),
  }));
  const totalShortfall = shortfallByRegion.reduce((s, x) => s + x.shortfall, 0);
  const regionsWithShortfall = shortfallByRegion.filter((x) => x.shortfall > 0);

  const eligiblePlots = eligibility?.eligible ?? [];
  const totalEmptyEligible = eligiblePlots.reduce(
    (s, p) => s + p.empty_slots,
    0
  );
  const hasPoweredEmpty = totalEmptyEligible > 0;
  const unpoweredPlots = eligibility?.unpoweredSkipped ?? [];

  if (!hasPoweredEmpty && unpoweredPlots.length === 0 && totalShortfall === 0)
    return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" gutterBottom>
          Alerts
        </Typography>

        <Stack gap={0.5}>
          {hasPoweredEmpty && (
            <Box>
              <Stack direction="row" gap={1} alignItems="center">
                <GroupAddOutlined sx={{ fontSize: 14, color: "info.main" }} />
                <Typography variant="caption" color="info.main">
                  Powered plots with empty workers ({totalEmptyEligible}) across{" "}
                  {eligiblePlots.length} plot
                  {eligiblePlots.length === 1 ? "" : "s"}
                </Typography>
              </Stack>
            </Box>
          )}

          {unpoweredPlots.length > 0 && (
            <Box>
              <Stack direction="row" gap={1} alignItems="center" mb={0.5}>
                <FlashOffOutlined
                  sx={{ fontSize: 14, color: "warning.main" }}
                />
                <Typography variant="caption" color="warning.main">
                  Unpowered plots: {unpoweredPlots.length}
                </Typography>
              </Stack>
            </Box>
          )}

          {totalShortfall > 0 ? (
            <Stack gap={1}>
              <Alert severity="warning">
                <Typography variant="caption" display="block">
                  DEC stake shortfall in {regionsWithShortfall.length} region
                  {regionsWithShortfall.length === 1 ? "" : "s"} — these regions
                  need more DEC staked before full PP can be earned:
                </Typography>
              </Alert>
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
            </Stack>
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
