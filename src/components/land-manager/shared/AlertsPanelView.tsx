"use client";

import WorksiteAlerts from "@/components/land-manager/shared/WorksiteAlerts";
// Type-only: these modules reach server actions (and through them Prisma), so a
// value import would drag the whole server chain into the browser bundle.
import type { PoolBufferRow } from "@/hooks/usePoolBufferAlerts";
import type { WorksiteAlertsData } from "@/hooks/useWorksiteAlerts";
import type { RegionDECInfo } from "@/lib/backend/actions/land-manager/dec-power-actions";
import { formatInt } from "@/lib/formatters";
import {
  POOL_BUFFER_WEEKS,
  type WorkerEligibilityResult,
} from "@/types/landManager";
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export interface AlertsPanelViewProps {
  /** True while the DEC/eligibility data is still loading. */
  loading?: boolean;
  /** Pool reserves versus weekly external need, one row per resource. */
  poolBufferRows: PoolBufferRow[];
  eligibility: WorkerEligibilityResult | null;
  /** Per-region DEC rows for all of the player's regions. */
  stakedDEC: RegionDECInfo[];
  totalStaked: number;
  totalRequired: number;
  globalShortfall: number;
  globalExcess: number;
  /** Worksite states blocked on the player — see `useWorksiteAlerts`. */
  worksiteAlerts: WorksiteAlertsData;
  /** A worksite broadcast is running. */
  worksiteBusy?: boolean;
  /** Progress text for the running worksite broadcast. */
  worksiteBusyLabel?: string | null;
  /** Error from the last worksite broadcast. */
  worksiteError?: string | null;
  /** Feed every plot in `worksiteAlerts.feedPlan.feedable`. */
  onFeedWorkers: () => void;
  /** Open the Fix grain deficit proposal — the dialog lives in the container. */
  onFixGrainDeficit: () => void;
}

/**
 * Presentation for the Alerts panel. Pure props in, no data fetching — the
 * container (AlertsPanel) owns the three hooks that supply it.
 *
 * Returns null when nothing needs the player's attention, so the panel takes no
 * room on a healthy account.
 */
export default function AlertsPanelView({
  loading = false,
  poolBufferRows,
  eligibility,
  stakedDEC,
  totalStaked,
  totalRequired,
  globalShortfall,
  globalExcess,
  worksiteAlerts,
  worksiteBusy = false,
  worksiteBusyLabel = null,
  worksiteError = null,
  onFeedWorkers,
  onFixGrainDeficit,
}: AlertsPanelViewProps) {
  if (loading) return <></>;

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
    lowPoolBuffers.length === 0 &&
    !worksiteAlerts.hasPending
  )
    return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" gutterBottom>
          Alerts
        </Typography>

        <Stack gap={0.5}>
          {/* Worksite states blocked on the player come first: unlike the DEC
              and pool rows below, each one has a button that resolves it. */}
          <WorksiteAlerts
            data={worksiteAlerts}
            busy={worksiteBusy}
            busyLabel={worksiteBusyLabel}
            error={worksiteError}
            onFeedWorkers={onFeedWorkers}
            onFixGrainDeficit={onFixGrainDeficit}
          />

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
                            {formatInt(r.poolResource)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {formatInt(r.unlockedResource)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {formatInt(r.weeklyExternalNeed)}
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
                  DEC stake shortfall of {formatInt(shortfall)} —{" "}
                  {formatInt(totalStaked)} staked vs {formatInt(totalRequired)}{" "}
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
                              {formatInt(region.dec_stake_in_use)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption">
                              {formatInt(region.dec_stake_needed)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="caption"
                              color="warning.main"
                              fontWeight="bold"
                            >
                              {formatInt(shortfall)}
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
                  DEC over-staked by {formatInt(excess)} —{" "}
                  {formatInt(totalStaked)} staked vs {formatInt(totalRequired)}{" "}
                  required. You could unstake up to {formatInt(excess)} DEC and
                  still fully power your regions
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
                              {formatInt(region.dec_stake_in_use)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption">
                              {formatInt(region.dec_stake_needed)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="caption"
                              color="info.main"
                              fontWeight="bold"
                            >
                              {formatInt(over)}
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
                  {formatInt(regionalShortfallTotal)}
                  DEC short across some regions while{" "}
                  {formatInt(regionalOverTotal)}
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
                                {formatInt(row.region.dec_stake_in_use)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption">
                                {formatInt(row.region.dec_stake_needed)}
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
                                {formatInt(gap)}
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
                DEC stake sufficient — {formatInt(totalStaked)} staked matches{" "}
                {formatInt(totalRequired)} required.
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
