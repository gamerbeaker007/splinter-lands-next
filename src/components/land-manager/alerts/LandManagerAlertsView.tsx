"use client";

import { AssignedWorkersAlerts } from "@/components/player-overview/player-dashboard/alerts/AssingedWorkersAlerts";
import { DeedAlertSection } from "@/components/player-overview/player-dashboard/alerts/DeedAlertSection";
import { MissingBloodLineBoostAlerts } from "@/components/player-overview/player-dashboard/alerts/MissingBloodLineBoostAlerts";
import { NegativeDECAlerts } from "@/components/player-overview/player-dashboard/alerts/NegativeDECAlerts";
import { NoWorkersAlerts } from "@/components/player-overview/player-dashboard/alerts/NoWorkersAlerts";
import { PowerCoreAlerts } from "@/components/player-overview/player-dashboard/alerts/PowerCoreAlerts";
import { RationingLiteAlerts } from "@/components/player-overview/player-dashboard/alerts/RationingLiteAlerts";
import { TerrainBoostsCard } from "@/components/player-overview/player-dashboard/alerts/TerrainBoostsCard";
import { TooMuchPPAlerts } from "@/components/player-overview/player-dashboard/alerts/TooMuchPPAlerts";
import { formatInt } from "@/lib/formatters";
import {
  ALERT_SEVERITIES,
  ALERT_SEVERITY_LABELS,
  AlertSeverity,
  deriveDecStatus,
  LandManagerAlert,
  LandManagerAlertsInput,
  RegionDecGap,
} from "@/lib/frontend/landManagerAlerts";
import { POOL_BUFFER_WEEKS } from "@/types/landManager";
import {
  CheckCircleOutline,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { ReactNode, useState } from "react";
import AlertCountBadges from "./AlertCountBadges";

export interface LandManagerAlertsViewProps {
  /** True while any alert source is still loading. */
  loading?: boolean;
  input: LandManagerAlertsInput;
  alerts: LandManagerAlert[];
  counts: Record<AlertSeverity, number>;
  /** The player dashboard checks failed to load. */
  playerAlertsError?: string | null;
  /** A worksite broadcast is running — every action button is disabled. */
  worksiteBusy?: boolean;
  /** Progress text for the running feed ("Signing…", "3/7 confirmed"). */
  worksiteBusyLabel?: string | null;
  /** Error from the last worksite broadcast. */
  worksiteError?: string | null;
  /** Feed every plot in `input.worksiteAlerts.feedPlan.feedable`. */
  onFeedWorkers: () => void;
  /** Open the Fix grain deficit proposal — the dialog lives in the container. */
  onFixGrainDeficit: () => void;
}

interface AlertBody {
  description: ReactNode;
  /** Resolves or leads to the problem (a broadcast or a link). */
  action?: ReactNode;
  /** Shown under the alert when the player expands it. */
  details?: ReactNode;
}

const GROUP_DESCRIPTIONS: Record<AlertSeverity, string> = {
  error: "Production or PP is being lost right now.",
  warning: "Sub-optimal setup or waiting on you.",
  info: "Optimisation opportunities — nothing is lost.",
};

function LinkAction({ href, label }: { href: string; label: string }) {
  return (
    <Button size="small" color="inherit" component={Link} href={href}>
      {label}
    </Button>
  );
}

function PlotChips({ labels }: { labels: string[] }) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.5}>
      {labels.map((label, i) => (
        <Chip key={`${label}-${i}`} label={label} size="small" />
      ))}
    </Stack>
  );
}

function DecGapTable({
  rows,
  gapLabel,
}: {
  rows: { row: RegionDecGap; short: boolean }[];
  gapLabel: string;
}) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Region</TableCell>
            <TableCell align="right">In use</TableCell>
            <TableCell align="right">Needed</TableCell>
            <TableCell align="right">{gapLabel}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ row, short }) => (
            <TableRow key={row.region.region_number}>
              <TableCell>R{row.region.region_number}</TableCell>
              <TableCell align="right">
                {formatInt(row.region.dec_stake_in_use)}
              </TableCell>
              <TableCell align="right">
                {formatInt(row.region.dec_stake_needed)}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: "bold",
                  color: short ? "warning.main" : "info.main",
                }}
              >
                {short ? "-" : "+"}
                {formatInt(row.gap)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

/**
 * Presentation for the Land Manager Alerts page. Pure props in, no data
 * fetching — the provider owns the data hooks and the container owns the
 * worksite broadcast and the Fix grain deficit dialog.
 */
export default function LandManagerAlertsView({
  loading = false,
  input,
  alerts,
  counts,
  playerAlertsError = null,
  worksiteBusy = false,
  worksiteBusyLabel = null,
  worksiteError = null,
  onFeedWorkers,
  onFixGrainDeficit,
}: LandManagerAlertsViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirmFeed, setConfirmFeed] = useState(false);

  const dec = deriveDecStatus(
    input.stakedDEC,
    input.globalShortfall,
    input.globalExcess
  );
  const { feedable, shortOnGrain } = input.worksiteAlerts.feedPlan;
  const feedGrain = feedable.reduce((sum, c) => sum + c.grainCost, 0);
  const card = input.cardAlerts;
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  function bodyOf(alert: LandManagerAlert): AlertBody {
    const n = alert.count;
    switch (alert.key) {
      case "decShortfall":
        return {
          description: (
            <>
              {formatInt(dec.shortfall)} DEC short —{" "}
              {formatInt(input.totalStaked)} staked vs{" "}
              {formatInt(input.totalRequired)} required. Stake more DEC before
              full PP can be earned.
            </>
          ),
          action: (
            <LinkAction href="/land-manager/production" label="Stake DEC" />
          ),
          details:
            dec.regionsWithShortfall.length > 0 ? (
              <DecGapTable
                gapLabel="Shortfall"
                rows={dec.regionsWithShortfall.map((row) => ({
                  row,
                  short: true,
                }))}
              />
            ) : undefined,
        };
      case "grainDeficit":
        return {
          description: (
            <>
              {plural(n, "finished worksite")} cannot be fed — their region does
              not hold enough grain.
            </>
          ),
          action: (
            <Tooltip title="Move grain in from your other regions (pool → transfer → swap → buy with DEC)">
              <span>
                <Button
                  size="small"
                  color="inherit"
                  disabled={
                    worksiteBusy || input.worksiteAlerts.fixTargets.length === 0
                  }
                  onClick={onFixGrainDeficit}
                >
                  Fix grain deficit
                </Button>
              </span>
            </Tooltip>
          ),
          details: <PlotChips labels={shortOnGrain.map((c) => c.plotLabel)} />,
        };
      case "noPower":
        return {
          description: (
            <>{plural(n, "plot")} without power — they do not produce.</>
          ),
          action: (
            <LinkAction
              href="/land-manager/production"
              label="Open production"
            />
          ),
          details: card && (
            <PowerCoreAlerts powerCoreAlerts={card.noPowerSource} />
          ),
        };
      case "feedWorkers":
        return {
          description: (
            <>
              {plural(n, "worksite")} finished construction and{" "}
              {n === 1 ? "is" : "are"} waiting to be fed — costs{" "}
              {formatInt(feedGrain)} GRAIN from the regions that hold it. Until
              they are fed they produce nothing.
            </>
          ),
          action: (
            <Button
              size="small"
              color="inherit"
              disabled={worksiteBusy}
              onClick={() => setConfirmFeed(true)}
              startIcon={
                worksiteBusy && worksiteBusyLabel ? (
                  <CircularProgress size={12} color="inherit" />
                ) : undefined
              }
            >
              {worksiteBusyLabel ?? "Feed workers"}
            </Button>
          ),
          details: <PlotChips labels={feedable.map((c) => c.plotLabel)} />,
        };
      case "finishedFull":
        return {
          description: (
            <>
              {plural(n, "plot")} finished building or{" "}
              {n === 1 ? "has a" : "have a"} full store — harvest to keep
              producing.
            </>
          ),
          action: (
            <LinkAction href="/land-manager/harvest" label="Open harvest" />
          ),
          details: input.deedAlerts && (
            <DeedAlertSection alerts={input.deedAlerts} />
          ),
        };
      case "lowPoolBuffer": {
        const low = input.poolBufferRows.filter((r) => r.belowBuffer);
        return {
          description: (
            <>
              {low.map((r) => r.symbol).join(", ")} pool reserves are below the
              recommended {POOL_BUFFER_WEEKS}-week external-need buffer. Top up
              the pools to keep harvesting tax free.
            </>
          ),
          action: (
            <LinkAction href="/land-manager/harvest" label="Top up pools" />
          ),
          details: (
            <Box sx={{ overflowX: "auto" }}>
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
                  {low.map((r) => (
                    <TableRow key={r.symbol}>
                      <TableCell>{r.symbol}</TableCell>
                      <TableCell align="right">
                        {formatInt(r.poolResource)}
                      </TableCell>
                      <TableCell align="right">
                        {formatInt(r.unlockedResource)}
                      </TableCell>
                      <TableCell align="right">
                        {formatInt(r.weeklyExternalNeed)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "warning.main" }}
                      >
                        {r.weeksCovered.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ),
        };
      }
      case "decImbalance":
        return {
          description: (
            <>
              {formatInt(dec.regionalShortfallTotal)} DEC short across some
              regions while {formatInt(dec.regionalOverTotal)} DEC is
              over-staked in others. Global DEC is balanced, but DEC needs to be
              moved between regions.
            </>
          ),
          action: (
            <LinkAction href="/land-manager/production" label="Rebalance DEC" />
          ),
          details: (
            <DecGapTable
              gapLabel="Gap"
              rows={[
                ...dec.regionsWithShortfall.map((row) => ({
                  row,
                  short: true,
                })),
                ...dec.regionsOverStaked.map((row) => ({ row, short: false })),
              ]}
            />
          ),
        };
      case "noWorkers":
        return {
          description: <>{plural(n, "plot")} have no workers assigned.</>,
          action: (
            <LinkAction href="/land-manager/production" label="Find workers" />
          ),
          details: card && (
            <NoWorkersAlerts noWorkersAlerts={card.noWorkersAlerts} />
          ),
        };
      case "missingWorkers":
        return {
          description: <>{plural(n, "plot")} have fewer than 5 workers.</>,
          action: (
            <LinkAction href="/land-manager/production" label="Find workers" />
          ),
          details: card && (
            <AssignedWorkersAlerts
              assignedWorkersAlerts={card.assignedWorkersAlerts}
            />
          ),
        };
      case "negativeDecNatural":
        return {
          description: (
            <>
              {plural(n, "deed")} producing a natural resource cost more DEC
              than they earn.
            </>
          ),
          details: card && (
            <NegativeDECAlerts
              negativeDECAlerts={card.negativeDECNaturalResourceDeeds}
            />
          ),
        };
      case "negativeDecOther":
        return {
          description: (
            <>
              {plural(n, "deed")} producing a non-natural resource cost more DEC
              than they earn.
            </>
          ),
          details: card && (
            <NegativeDECAlerts
              negativeDECAlerts={card.negativeDECOtherResourceDeeds}
            />
          ),
        };
      case "negativeTerrainBoost":
        return {
          description: (
            <>{plural(n, "card")} staked on terrain that lowers their PP.</>
          ),
          details: card && (
            <TerrainBoostsCard
              terrainBoosts={card.terrainBoostAlerts.negative}
            />
          ),
        };
      case "doublePower":
        return {
          description: (
            <>
              {plural(n, "plot")} have a power core staked while already
              energized — the core is wasted there.
            </>
          ),
          details: card && (
            <PowerCoreAlerts powerCoreAlerts={card.powerCoreWhileEnergized} />
          ),
        };
      case "missingBloodline":
        return {
          description: (
            <>
              {plural(n, "deed")} have a bloodline card without a second card of
              that bloodline.
            </>
          ),
          details: card && (
            <MissingBloodLineBoostAlerts
              missingBloodLineBoostAlerts={card.missingBloodLineBoost}
            />
          ),
        };
      case "tooMuchBasePP":
        return {
          description: (
            <>
              {plural(n, "deed")} exceed the 100K base PP cap — the excess is
              not counted.
            </>
          ),
          details: card && (
            <TooMuchPPAlerts tooMuchBasePP={card.tooMuchBasePP} />
          ),
        };
      case "rationingLite":
        return {
          description: (
            <>
              {plural(n, "deed")} above 20K base PP carry a Rationing Lite
              penalty.
            </>
          ),
          details: card && (
            <RationingLiteAlerts
              rationingLiteAlerts={card.rationingLiteAlerts}
            />
          ),
        };
      case "decOverStaked":
        return {
          description: (
            <>
              {formatInt(dec.excess)} DEC over-staked —{" "}
              {formatInt(input.totalStaked)} staked vs{" "}
              {formatInt(input.totalRequired)} required. You could unstake up to{" "}
              {formatInt(dec.excess)} DEC and still fully power your regions.
            </>
          ),
          action: (
            <LinkAction href="/land-manager/production" label="Unstake DEC" />
          ),
          details:
            dec.regionsOverStaked.length > 0 ? (
              <DecGapTable
                gapLabel="Over by"
                rows={dec.regionsOverStaked.map((row) => ({
                  row,
                  short: false,
                }))}
              />
            ) : undefined,
        };
      case "emptyWorkerSlots": {
        const plots = input.eligibility?.eligible ?? [];
        return {
          description: (
            <>
              {plural(n, "empty worker slot")} across{" "}
              {plural(plots.length, "powered plot")}.
            </>
          ),
          action: (
            <LinkAction href="/land-manager/production" label="Find workers" />
          ),
          details: (
            <PlotChips
              labels={plots.map(
                (p) =>
                  `R${p.region_number}-${p.tract_number}-${p.plot_number} (${p.empty_slots} empty)`
              )}
            />
          ),
        };
      }
      case "undeveloped":
        return {
          description: (
            <>
              {plural(n, "plot")} have no worksite yet and produce nothing. Pick
              a building to start production.
            </>
          ),
          action: (
            <LinkAction href="/land-manager/worksite" label="Open worksites" />
          ),
          details: (
            <PlotChips
              labels={input.worksiteAlerts.undeveloped.map((u) => u.plotLabel)}
            />
          ),
        };
      case "zeroBoostNonNeutral":
        return {
          description: (
            <>
              {plural(n, "card")} with an element get no terrain boost on their
              plot.
            </>
          ),
          details: card && (
            <TerrainBoostsCard
              terrainBoosts={card.terrainBoostAlerts.zeroNonNeutral}
            />
          ),
        };
      case "zeroBoostNeutral":
        return {
          description: (
            <>{plural(n, "neutral card")} get no terrain boost on their plot.</>
          ),
          details: card && (
            <TerrainBoostsCard
              terrainBoosts={card.terrainBoostAlerts.zeroNeutral}
            />
          ),
        };
      case "unusedPowerCore":
        return {
          description: (
            <>{plural(n, "power core")} owned but not staked on a plot.</>
          ),
        };
    }
  }

  function renderAlert(alert: LandManagerAlert) {
    const body = bodyOf(alert);
    const open = expanded.has(alert.key);
    return (
      <Alert
        key={alert.key}
        severity={alert.severity}
        action={
          <Stack direction="row" alignItems="center" gap={0.5}>
            {body.action}
            {body.details && (
              <Button
                size="small"
                color="inherit"
                onClick={() => toggle(alert.key)}
                endIcon={open ? <ExpandLess /> : <ExpandMore />}
              >
                {open ? "Hide" : "Details"}
              </Button>
            )}
          </Stack>
        }
        sx={{ "& .MuiAlert-message": { width: "100%", minWidth: 0 } }}
      >
        <AlertTitle sx={{ mb: 0.25 }}>
          {alert.title} ({formatInt(alert.count)})
        </AlertTitle>
        <Typography variant="body2">{body.description}</Typography>
        {body.details && (
          <Collapse in={open} unmountOnExit>
            <Box sx={{ mt: 1, overflowX: "auto" }}>{body.details}</Box>
          </Collapse>
        )}
      </Alert>
    );
  }

  const decHealthy =
    !loading &&
    input.totalRequired > 0 &&
    !alerts.some((a) =>
      ["decShortfall", "decOverStaked", "decImbalance"].includes(a.key)
    );

  return (
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
        <AlertCountBadges counts={counts} />
        {loading && (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularProgress size={14} />
            <Typography variant="body2" color="text.secondary">
              Loading alerts…
            </Typography>
          </Stack>
        )}
      </Stack>

      {worksiteError && <Alert severity="error">{worksiteError}</Alert>}
      {playerAlertsError && (
        <Alert severity="error">
          Player dashboard alerts could not be loaded: {playerAlertsError}
        </Alert>
      )}

      {!loading && alerts.length === 0 && (
        <Alert severity="success">
          No alerts — nothing needs your attention right now.
        </Alert>
      )}

      {ALERT_SEVERITIES.map((severity) => {
        const group = alerts.filter((a) => a.severity === severity);
        if (group.length === 0) return null;
        return (
          <Box key={severity}>
            <Typography variant="subtitle1" fontWeight={700}>
              {ALERT_SEVERITY_LABELS[severity]} ({group.length})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {GROUP_DESCRIPTIONS[severity]}
            </Typography>
            <Stack gap={1} mt={1}>
              {group.map(renderAlert)}
            </Stack>
          </Box>
        );
      })}

      {decHealthy && (
        <Stack direction="row" gap={1} alignItems="center">
          <CheckCircleOutline sx={{ fontSize: 16, color: "success.main" }} />
          <Typography variant="caption" color="text.secondary">
            DEC stake sufficient — {formatInt(input.totalStaked)} staked matches{" "}
            {formatInt(input.totalRequired)} required.
          </Typography>
        </Stack>
      )}

      {/* Plan-then-confirm, matching every other broadcast in the Land Manager. */}
      <Dialog
        open={confirmFeed}
        onClose={() => setConfirmFeed(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Feed workers?</DialogTitle>
        <DialogContent sx={{ pt: "0 !important" }}>
          <Typography variant="body2" color="text.secondary">
            Activate {plural(feedable.length, "finished worksite")} by feeding
            their workers. This pays{" "}
            <strong>{formatInt(feedGrain)} GRAIN</strong> from the regions
            holding it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setConfirmFeed(false)}>
            Back
          </Button>
          <Button
            size="small"
            variant="contained"
            autoFocus
            onClick={() => {
              setConfirmFeed(false);
              onFeedWorkers();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
