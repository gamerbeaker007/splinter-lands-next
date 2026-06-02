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
  const {
    eligibility,
    stakedDEC,
    totalStaked,
    totalRequired,
    globalShortfall,
    globalExcess,
    loading,
  } = useLandManagerRegionData(enabledRegions, refreshKey);

  if (enabledRegions.length === 0) return null;
  if (loading) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={100} />
      </Box>
    );
  }

  // Whether enough DEC is staked is decided from the GLOBAL pool, not the sum
  // of per-region gaps: while a building is in progress a region's staked DEC
  // can read 0 even though that DEC is still staked overall. Per-region rows are
  // only shown as guidance when there is a genuine global shortfall.
  const shortfall = Math.ceil(globalShortfall);
  const excess = Math.floor(globalExcess);
  const regionsWithShortfall = stakedDEC
    .map((r) => ({
      region: r,
      shortfall: Math.max(0, r.dec_stake_needed - r.dec_stake_in_use),
    }))
    .filter((x) => x.shortfall > 0);
  const regionsOverStaked = stakedDEC
    .map((r) => ({
      region: r,
      over: Math.max(0, r.dec_stake_in_use - r.dec_stake_needed),
    }))
    .filter((x) => x.over > 0);

  const eligiblePlots = eligibility?.eligible ?? [];
  const totalEmptyEligible = eligiblePlots.reduce(
    (s, p) => s + p.empty_slots,
    0
  );
  const hasPoweredEmpty = totalEmptyEligible > 0;
  const unpoweredPlots = eligibility?.unpoweredSkipped ?? [];

  if (
    !hasPoweredEmpty &&
    unpoweredPlots.length === 0 &&
    shortfall === 0 &&
    excess === 0
  )
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

          {shortfall > 0 ? (
            <Stack gap={1}>
              <Alert severity="warning">
                <Typography variant="caption" display="block">
                  DEC stake shortfall of {fmtNum(shortfall)} —{" "}
                  {fmtNum(totalStaked)} staked vs {fmtNum(totalRequired)}{" "}
                  required. Stake more DEC before full PP can be earned
                  {regionsWithShortfall.length > 0
                    ? ` (regions currently showing a gap below):`
                    : `.`}
                </Typography>
              </Alert>
              {regionsWithShortfall.length > 0 && (
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
              )}
            </Stack>
          ) : excess > 0 ? (
            <Stack gap={1}>
              <Alert severity="info">
                <Typography variant="caption" display="block">
                  DEC over-staked by {fmtNum(excess)} — {fmtNum(totalStaked)}{" "}
                  staked vs {fmtNum(totalRequired)} required. You could unstake
                  up to {fmtNum(excess)} DEC and still fully power your regions
                  {regionsOverStaked.length > 0
                    ? ` (regions currently over-staked below):`
                    : `.`}
                </Typography>
              </Alert>
              {regionsOverStaked.length > 0 && (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Region</TableCell>
                        <TableCell align="right">In use</TableCell>
                        <TableCell align="right">Needed</TableCell>
                        <TableCell align="right">Over by</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {regionsOverStaked.map(({ region, over }) => (
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
                              color="info.main"
                              fontWeight="bold"
                            >
                              {fmtNum(over)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Stack>
          ) : (
            <Stack direction="row" gap={1} alignItems="center">
              <CheckCircleOutline
                sx={{ fontSize: 14, color: "success.main" }}
              />
              <Typography variant="caption" color="text.secondary">
                DEC stake sufficient — {fmtNum(totalStaked)} staked matches{" "}
                {fmtNum(totalRequired)} required.
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
