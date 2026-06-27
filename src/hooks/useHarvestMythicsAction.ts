import { getTodayPaidDonations } from "@/lib/backend/actions/land-manager/donation-actions";
import { recordMythicHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getLandPools,
  getPlayerMythicDeeds,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  applyDailyCaps,
  buildDonationOps,
  capDonationsAtBalance,
  planMythicDonations,
} from "@/lib/frontend/donationPayment";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { buildTaxCollectionOp } from "@/lib/shared/operations/opBuilders";
import {
  DEFAULT_DONATION_RECIPIENT,
  DonationConfig,
  DryRunResult,
  MythicHarvestResult,
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

interface UseHarvestMythicsAction {
  busy: boolean;
  isVerifying: boolean;
  result: BroadcastResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  execute: (isDryRun: boolean) => Promise<DryRunResult | null>;
}

type InternalBusy = "running" | "verifying" | null;

export function useHarvestMythicsAction({
  username,
  visibleRegions,
  donation,
  onSuccess,
}: Params): UseHarvestMythicsAction {
  const [internalBusy, setInternalBusy] = useState<InternalBusy>(null);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const payDonations = usePayDonations(username);

  const donationEnabled =
    donation.enabled &&
    donation.pct > 0 &&
    username.toLowerCase() !== DEFAULT_DONATION_RECIPIENT.toLowerCase();

  const doExecute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      setInternalBusy("running");
      setResult(null);
      setError(null);
      try {
        const enabledUids = new Set(visibleRegions.map((r) => r.region_uid));
        const allDeeds = await getPlayerMythicDeeds();
        const mythicDeeds = allDeeds.filter((d) =>
          enabledUids.has(d.region_uid)
        );
        const regionNameMap = new Map(
          visibleRegions.map((r) => [r.region_uid, r.name])
        );

        if (isDryRun) {
          const [{ pools }, { balances }] = await Promise.all([
            getLandPools(),
            getBulkRegionData(
              visibleRegions.map((r) => r.region_uid),
              !isDryRun
            ),
          ]);
          const log = mythicDeeds.map((d) => {
            const taxes =
              d.taxes.map((t) => `${t.token} ${t.balance}`).join(", ") ||
              "nothing";
            const loc =
              d.kingdom_type === "keep"
                ? `region(${d.region_number}) tract(${d.tract_number})`
                : `region(${d.region_number})`;
            return `${d.kingdom_type} ${loc}: ${taxes}`;
          });
          const desired = planMythicDonations(
            mythicDeeds,
            regionNameMap,
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
          const capped = capDonationsAtBalance(dailyCapped, balances);
          const { log: donationLog } = buildDonationOps(
            username,
            pools,
            capped
          );
          log.push(...donationLog);
          return { title: "Dry Run — Harvest Mythics", log };
        }

        if (!mythicDeeds.some((d) => d.taxes.length > 0)) {
          setError("No mythic deeds have resources to harvest.");
          return null;
        }

        const ops: [string, object][] = mythicDeeds.map((deed) =>
          buildTaxCollectionOp(username, deed.region_uid, deed.deed_uid)
        );
        if (ops.length === 0) {
          setError("No mythic deeds found.");
          return null;
        }

        // ── Phase 1: harvest ──
        const res = await broadcastOperations(username, ops);
        if (!res.success) {
          setError(res.error ?? "Broadcast failed");
          return null;
        }

        setInternalBusy("verifying");
        await waitForTransactions(res.txIds);

        const harvestResults: MythicHarvestResult[] = mythicDeeds.map((d) => ({
          deed_uid: d.deed_uid,
          region_uid: d.region_uid,
          region_number: d.region_number,
          tract_number: d.tract_number,
          kingdom_type: d.kingdom_type,
          tokens: d.taxes.map((t) => ({
            token: t.token,
            received: String(t.balance),
          })),
          fragment_found: false,
          fragment_chance: d.estimated_totem_chance ?? 0,
        }));

        // ── Phase 2: donations ──
        setInternalBusy("running");
        const { pools } = await getLandPools();
        const desired = planMythicDonations(
          mythicDeeds,
          regionNameMap,
          () => donationEnabled,
          donation.pct
        );
        let donationOutcome: PayDonationsResult;
        if (desired.length === 0) {
          donationOutcome = {
            success: true,
            paidDonations: {},
            unpaidDonations: {},
            donationError: null,
            txIds: [],
            log: ["No transferrable donations to pay."],
          };
        } else {
          donationOutcome = await payDonations.execute(
            desired,
            pools,
            donation
          );
          if (donationOutcome.donationError)
            setError(donationOutcome.donationError);
        }

        await recordMythicHarvestLog(username, harvestResults, res.txIds, {
          paidDonations: donationOutcome.paidDonations,
          unpaidDonations: donationOutcome.unpaidDonations,
          donationError: donationOutcome.donationError,
          donationTxIds: donationOutcome.txIds,
        }).catch(() => {});
        setResult(res);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setInternalBusy(null);
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
    async (isDryRun: boolean): Promise<DryRunResult | null> =>
      doExecute(isDryRun),
    [doExecute]
  );

  return {
    busy: internalBusy !== null,
    isVerifying: internalBusy === "verifying",
    result,
    error,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    execute,
  };
}
