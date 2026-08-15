import { getTodayPaidDonations } from "@/lib/backend/actions/land-manager/donation-actions";
import {
  recordDonationsLog,
  recordHarvestLog,
} from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getLandPools,
  invalidatePlayerRegionCaches,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  applyDailyCaps,
  buildDonationOps,
  capDonationsAtBalance,
  planDesiredDonations,
} from "@/lib/frontend/donationPayment";
import {
  broadcastHarvest,
  HarvestBroadcastResult,
} from "@/lib/frontend/executeHarvestFlow";
import {
  buildRegionHarvestOnlyOp,
  summarizeHarvestedResources,
} from "@/lib/frontend/harvestOps";
import {
  canHarvestRegion,
  effectiveBalance,
} from "@/lib/shared/landManagerUtils";
import {
  DEFAULT_DONATION_RECIPIENT,
  DonationConfig,
  ActionPlan,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useCallback, useState } from "react";
import { PayDonationsResult, usePayDonations } from "./usePayDonations";

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  donation: DonationConfig;
  onSuccess?: () => void;
}

export interface HarvestAllResult {
  success: boolean;
  txIds: string[];
  harvestTxIds: string[];
  donations: PayDonationsResult | null;
  log: string[];
}

interface UseHarvestAllAction {
  busy: boolean;
  result: HarvestAllResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  execute: (planOnly: boolean) => Promise<ActionPlan | null>;
}

const EMPTY_BALANCE: Record<string, number> = {
  GRAIN: 0,
  WOOD: 0,
  STONE: 0,
  IRON: 0,
  AURA: 0,
};

export function useHarvestAllAction({
  username,
  visibleRegions,
  donation,
  onSuccess,
}: Params): UseHarvestAllAction {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<HarvestAllResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const payDonations = usePayDonations(username);

  const donationEnabled =
    donation.enabled &&
    donation.pct > 0 &&
    username.toLowerCase() !== DEFAULT_DONATION_RECIPIENT.toLowerCase();

  const doExecute = useCallback(
    async (planOnly: boolean): Promise<ActionPlan | null> => {
      setBusy(true);
      setResult(null);
      setError(null);
      try {
        const [{ harvestable, balances }, { pools }] = await Promise.all([
          getBulkRegionData(
            visibleRegions.map((r) => r.region_uid),
            !planOnly
          ),
          getLandPools(),
        ]);
        const adjustedBalances = Object.fromEntries(
          visibleRegions.map((r) => [
            r.region_uid,
            effectiveBalance(balances[r.region_uid] ?? EMPTY_BALANCE, r),
          ])
        );

        const eligibleRegions = visibleRegions.filter((r) =>
          canHarvestRegion(
            harvestable[r.region_uid] ?? [],
            adjustedBalances[r.region_uid]
          )
        );

        if (planOnly) {
          const log: string[] = [];
          for (const region of eligibleRegions) {
            const built = buildRegionHarvestOnlyOp(username, region);
            log.push(...built.log);
          }
          // For preview, cap against the pre-harvest effective balance — best
          // estimate we have without actually broadcasting.
          const desired = planDesiredDonations(
            eligibleRegions,
            harvestable,
            () => donationEnabled,
            donation.pct
          );
          const alreadyPaid = await getTodayPaidDonations(username).catch(
            () => ({})
          );
          const dailyCapped = applyDailyCaps(
            desired,
            alreadyPaid,
            donation.daily_caps
          );
          const capped = capDonationsAtBalance(dailyCapped, adjustedBalances);
          const { log: donationLog } = buildDonationOps(
            username,
            pools,
            capped
          );
          log.push(...donationLog);
          return { title: "Review plan — Harvest All", log };
        }

        if (eligibleRegions.length === 0) {
          setError("No regions are ready to harvest.");
          return null;
        }

        // ── Phase 1: harvest ──
        const harvestRes: HarvestBroadcastResult = await broadcastHarvest(
          username,
          eligibleRegions
        );
        if (!harvestRes.success) {
          setError(harvestRes.error ?? "Harvest failed");
          return null;
        }
        const harvestedSummary = summarizeHarvestedResources(harvestable);
        await recordHarvestLog({
          player: username,
          resources: harvestedSummary,
          txIds: harvestRes.txIds,
        }).catch(() => {});

        // ── Phase 2: donations ──
        const desired = planDesiredDonations(
          eligibleRegions,
          harvestable,
          () => donationEnabled,
          donation.pct
        );
        let donationOutcome: PayDonationsResult | null = null;
        if (desired.length === 0) {
          donationOutcome = {
            success: true,
            paidDonations: {},
            unpaidDonations: {},
            donationError: null,
            txIds: [],
            log: ["No transferrable donations to pay this run."],
          };
        } else {
          donationOutcome = await payDonations.execute(
            desired,
            pools,
            donation
          );
          await recordDonationsLog({
            player: username,
            paidDonations: donationOutcome.paidDonations,
            unpaidDonations: donationOutcome.unpaidDonations,
            donationError: donationOutcome.donationError,
            txIds: donationOutcome.txIds,
          }).catch(() => {});
          if (donationOutcome.donationError)
            setError(donationOutcome.donationError);
        }

        setResult({
          success: donationOutcome.success,
          txIds: [...harvestRes.txIds, ...donationOutcome.txIds],
          harvestTxIds: harvestRes.txIds,
          donations: donationOutcome,
          log: [...harvestRes.log, ...donationOutcome.log],
        });
        // Clear the cached pre-action snapshot so the refresh below reads
        // post-action balances rather than winning a cache hit on stale data.
        await invalidatePlayerRegionCaches().catch(() => {});
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setBusy(false);
      }
      return null;
    },
    [
      username,
      visibleRegions,
      onSuccess,
      payDonations,
      donation,
      donationEnabled,
    ]
  );

  const execute = useCallback(
    async (planOnly: boolean): Promise<ActionPlan | null> =>
      doExecute(planOnly),
    [doExecute]
  );

  return {
    busy: busy || payDonations.busy,
    result,
    error,
    clearResult: () => {
      setResult(null);
      payDonations.clear();
    },
    clearError: () => setError(null),
    execute,
  };
}
