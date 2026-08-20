"use client";

import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import { usePoolBufferAlerts } from "@/hooks/usePoolBufferAlerts";
import { POOL_BUFFER_WEEKS } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
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

interface Props {
  enabledRegions: number[];
  /** All of the player's regions — needed to measure consumption per region. */
  allRegions: SplProductionOverviewRegion[];
  /** True when either pool strategy is configured (pool withdraw or top-up). */
  poolStrategyEnabled: boolean;
  refreshKey?: number;
}

function fmtNum(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function AlertsPanel({
  enabledRegions,
  allRegions,
  poolStrategyEnabled,
  refreshKey = 0,
}: Props) {
  const { rows: poolBufferRows } = usePoolBufferAlerts(
    allRegions,
    enabledRegions,
    poolStrategyEnabled,
    refreshKey
  );
  const {
    eligibility,
    stakedDEC,
    totalStaked,
    totalRequired,
    globalShortfall,
    globalExcess,
    loading,
  } = useLandManagerRegionData(enabledRegions, refreshKey);

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
  const regionalShortfallTotal = Math.ceil(
    regionsWithShortfall.reduce((sum, x) => sum + x.shortfall, 0)
  );
  const regionalOverTotal = Math.floor(
    regionsOverStaked.reduce((sum, x) => sum + x.over, 0)
  );
  const hasRegionalImbalance =
    shortfall === 0 &&
    excess === 0 &&
    regionsWithShortfall.length > 0 &&
    regionsOverStaked.length > 0;

  const eligiblePlots = eligibility?.eligible ?? [];
  const totalEmptyEligible = eligiblePlots.reduce(
    (s, p) => s + p.empty_slots,
    0
  );
  const hasPoweredEmpty = totalEmptyEligible > 0;
  const unpoweredPlots = eligibility?.unpoweredSkipped ?? [];

  // Only resources actually below the recommended buffer are worth surfacing.
  const lowPoolBuffers = poolBufferRows.filter((r) => r.belowBuffer);

  if (
    !hasPoweredEmpty &&
    unpoweredPlots.length === 0 &&
    shortfall === 0 &&
    excess === 0 &&
    !hasRegionalImbalance &&
    lowPoolBuffers.length === 0
  )
    return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" gutterBottom>
          Alerts
        </Typography>

        <Stack gap={0.5}>
          {lowPoolBuffers.length > 0 && (
            <Alert severity="warning">
              <Typography variant="caption" display="block">
                {lowPoolBuffers.map((r) => r.symbol).join(", ")} pool reserves
                are below the recommended {POOL_BUFFER_WEEKS}-week external-need
                buffer. Top up the pools to keep harvesting tax free.
              </Typography>
              <Box sx={{ overflowX: "auto", mt: 0.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Resource</TableCell>
                      <TableCell align="right">In pool</TableCell>
                      <TableCell align="right">Unlocked</TableCell>
                      <TableCell align="right">Weekly need</TableCell>
                      <TableCell align="right">Weeks covered</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowPoolBuffers.map((r) => (
                      <TableRow key={r.symbol}>
                        <TableCell>
                          <Typography variant="caption">{r.symbol}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {fmtNum(r.poolResource)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {fmtNum(r.unlockedResource)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {fmtNum(r.weeklyExternalNeed)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="caption"
                            color="warning.main"
                            fontWeight="bold"
                          >
                            {r.weeksCovered.toFixed(1)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Alert>
          )}

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
          ) : hasRegionalImbalance ? (
            <Stack gap={1}>
              <Alert severity="warning">
                <Typography variant="caption" display="block">
                  Regional DEC imbalance detected:{" "}
                  {fmtNum(regionalShortfallTotal)}
                  DEC short across some regions while{" "}
                  {fmtNum(regionalOverTotal)}
                  DEC is over-staked in others. Global DEC is balanced, but DEC
                  needs to be moved between regions.
                </Typography>
              </Alert>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Region</TableCell>
                      <TableCell align="right">In use</TableCell>
                      <TableCell align="right">Needed</TableCell>
                      <TableCell align="right">Gap</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...regionsWithShortfall, ...regionsOverStaked].map(
                      (row) => {
                        const isShortfall = "shortfall" in row;
                        const gap = isShortfall ? row.shortfall : row.over;
                        return (
                          <TableRow key={row.region.region_number}>
                            <TableCell>
                              <Typography variant="caption">
                                R{row.region.region_number}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption">
                                {fmtNum(row.region.dec_stake_in_use)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption">
                                {fmtNum(row.region.dec_stake_needed)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="caption"
                                color={
                                  isShortfall ? "warning.main" : "info.main"
                                }
                                fontWeight="bold"
                              >
                                {isShortfall ? "-" : "+"}
                                {fmtNum(gap)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
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
