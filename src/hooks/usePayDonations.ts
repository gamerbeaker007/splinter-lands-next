import { getTodayPaidDonations } from "@/lib/backend/actions/land-manager/donation-actions";
import { getBulkRegionData } from "@/lib/backend/actions/land-manager/overview-actions";
import {
  applyDailyCaps,
  buildDonationOps,
  capDonationsAtBalance,
  DesiredDonation,
  summarizeDonations,
} from "@/lib/frontend/donationPayment";
import {
  broadcastOperations,
  KeychainKeyTypes,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  DEFAULT_DONATION_CONFIG,
  DEFAULT_DONATION_DAILY_CAPS,
  DonationConfig,
} from "@/types/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { useCallback, useState } from "react";

export interface PayDonationsResult {
  success: boolean;
  paidDonations: Record<string, number>;
  unpaidDonations: Record<string, number>;
  donationError: string | null;
  txIds: string[];
  log: string[];
}

export interface UsePayDonations {
  busy: boolean;
  result: PayDonationsResult | null;
  clear: () => void;
  execute: (
    desired: DesiredDonation[],
    pools: SplLandPool[],
    donation?: DonationConfig
  ) => Promise<PayDonationsResult>;
}

const EMPTY_RESULT: PayDonationsResult = {
  success: true,
  paidDonations: {},
  unpaidDonations: {},
  donationError: null,
  txIds: [],
  log: [],
};

export function usePayDonations(username: string): UsePayDonations {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PayDonationsResult | null>(null);

  const execute = useCallback(
    async (
      desired: DesiredDonation[],
      pools: SplLandPool[],
      donation: DonationConfig = DEFAULT_DONATION_CONFIG
    ): Promise<PayDonationsResult> => {
      setBusy(true);
      setResult(null);

      const log: string[] = [];

      if (desired.length === 0) {
        log.push("No donations to pay this run.");
        const r = { ...EMPTY_RESULT, log };
        setResult(r);
        setBusy(false);
        return r;
      }

      let alreadyPaid: Record<string, number> = {};
      try {
        alreadyPaid = await getTodayPaidDonations(username);
      } catch {
        log.push(
          "Could not read today's donation history — daily cap not applied this run."
        );
      }

      const dailyCaps = donation.daily_caps ?? DEFAULT_DONATION_DAILY_CAPS;
      const dailyCapped = applyDailyCaps(desired, alreadyPaid, dailyCaps);

      if (dailyCapped.length < desired.length) {
        const dropped = desired
          .filter(
            (f) =>
              !dailyCapped.some(
                (c) => c.region_uid === f.region_uid && c.symbol === f.symbol
              )
          )
          .map((f) => `${f.symbol} (${f.region_name})`);
        log.push(`  Daily cap reached - skipping: ${dropped.join(", ")}`);
      }

      if (dailyCapped.length === 0) {
        log.push(
          "Daily donation cap reached for all resources - no donations owed this run."
        );
        const r = { ...EMPTY_RESULT, log };
        setResult(r);
        setBusy(false);
        return r;
      }

      let balances: Record<string, Record<string, number>> = {};
      try {
        const regionUids = [...new Set(dailyCapped.map((f) => f.region_uid))];
        const refreshed = await getBulkRegionData(regionUids, true);
        balances = refreshed.balances;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Balance refresh failed";
        log.push(`${message} - cannot determine capped donations`);
        const desiredTotals = summarizeDonations(dailyCapped);
        const r: PayDonationsResult = {
          success: false,
          paidDonations: {},
          unpaidDonations: desiredTotals,
          donationError: message,
          txIds: [],
          log,
        };
        setResult(r);
        setBusy(false);
        return r;
      }

      const plan = capDonationsAtBalance(dailyCapped, balances);
      for (const donationPlan of plan) {
        if (donationPlan.capped) {
          log.push(
            `  Donation for ${donationPlan.region_name} ${donationPlan.symbol} capped at ${donationPlan.amount} (owed ${donationPlan.desired_amount}, region balance too low)`
          );
        }
      }

      if (plan.length === 0) {
        log.push(
          "After capping, no donations can be paid (regions have no balance to spare)."
        );
        const r: PayDonationsResult = {
          success: true,
          paidDonations: {},
          unpaidDonations: summarizeDonations(dailyCapped),
          donationError:
            "All donations capped to zero (insufficient region balances)",
          txIds: [],
          log,
        };
        setResult(r);
        setBusy(false);
        return r;
      }

      const { postingOps, log: donationLog } = buildDonationOps(
        username,
        pools,
        plan
      );
      log.push(...donationLog);

      const txIds: string[] = [];
      let donationError: string | null = null;

      if (postingOps.length > 0) {
        try {
          const res = await broadcastOperations(
            username,
            postingOps,
            KeychainKeyTypes.posting
          );
          if (res.success) {
            txIds.push(...res.txIds);
            await waitForTransactions(res.txIds);
          } else {
            donationError = res.error ?? "Resource donation broadcast rejected";
          }
        } catch (err) {
          donationError =
            err instanceof Error ? err.message : "Resource donation failed";
        }
      }

      const plannedTotals = summarizeDonations(plan);
      const paidDonations = donationError === null ? plannedTotals : {};
      const unpaidDonations = donationError === null ? {} : plannedTotals;
      if (donationError !== null) {
        log.push(`Donation step did not complete: ${donationError}`);
      }

      const r: PayDonationsResult = {
        success: donationError === null,
        paidDonations,
        unpaidDonations,
        donationError,
        txIds,
        log,
      };
      setResult(r);
      setBusy(false);
      return r;
    },
    [username]
  );

  return {
    busy,
    result,
    clear: () => setResult(null),
    execute,
  };
}
