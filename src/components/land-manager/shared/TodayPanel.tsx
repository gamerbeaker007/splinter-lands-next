"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { useCardDetailsAction } from "@/hooks/useCardDetails";
import { getTodayLogs } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getSettledTxOutcome,
  lookupTxOutcome,
} from "@/lib/frontend/settledTxOutcomes";
import { TodayLogs } from "@/types/landManager";
import { SplTrxResult } from "@/types/spl/trx";
import { useEffect, useMemo, useState } from "react";
import TodayPanelView from "./TodayPanelView";

/** Second (and last) lookup pass for ids SPL had not indexed yet. */
const RECHECK_DELAY_MS = 5000;

function loggedTxIds(data: TodayLogs | undefined): string[] {
  if (!data) return [];
  return [
    ...new Set([
      ...(data.harvest?.harvest_transactions ?? []),
      ...(data.harvest?.donation_transactions ?? []),
      ...(data.makeHarvestable?.transactions ?? []),
      ...(data.postHarvest?.transactions ?? []),
      ...(data.mythicHarvest?.transactions ?? []),
      ...(data.mythicHarvest?.donation_transactions ?? []),
      ...(data.worker?.rent_transactions ?? []),
      ...(data.worker?.purchase_transactions ?? []),
      ...(data.worker?.stake_transactions ?? []),
      ...(data.stakeDec?.transactions ?? []),
      ...(data.unstakeDec?.transactions ?? []),
    ]),
  ];
}

export default function TodayPanel({
  refreshKey = 0,
}: {
  refreshKey?: number;
}) {
  const { data, loading } = useAsyncData(`today-logs:${refreshKey}`, () =>
    getTodayLogs()
  );
  const { cardDetails } = useCardDetailsAction();
  // Bumped after each lookup pass so the outcomes below are re-read.
  const [lookupVersion, setLookupVersion] = useState(0);

  const txIds = useMemo(() => loggedTxIds(data), [data]);

  // Settled ids (this tab, any flow) are never looked up again — see
  // settledTxOutcomes. Only still-unknown ids hit SPL, from the browser.
  useEffect(() => {
    const unknown = (ids: string[]) =>
      ids.filter((id) => !getSettledTxOutcome(id));
    const toPoll = unknown(txIds);
    if (toPoll.length === 0) return;

    let cancelled = false;
    const lookupAll = (ids: string[]) =>
      Promise.all(ids.map((txId) => lookupTxOutcome(txId)));

    void (async () => {
      await lookupAll(toPoll);
      if (cancelled) return;
      setLookupVersion((v) => v + 1);

      const remaining = unknown(toPoll);
      if (remaining.length === 0) return;
      await new Promise((r) => setTimeout(r, RECHECK_DELAY_MS));
      if (cancelled) return;
      await lookupAll(remaining);
      if (!cancelled) setLookupVersion((v) => v + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [txIds]);

  // The parsed payload of each confirmed tx is the only source for what the
  // engine actually awarded (totem fragments, Labor's Luck cards).
  const { verifiedTxIds, failedTxIds, txResults } = useMemo(() => {
    void lookupVersion; // re-read the record after each lookup pass
    const verified = new Set<string>();
    const failed = new Map<string, string>();
    const results = new Map<string, SplTrxResult>();
    for (const id of txIds) {
      const outcome = getSettledTxOutcome(id);
      if (outcome?.status === "success") {
        verified.add(id);
        results.set(id, outcome.result);
      } else if (outcome?.status === "failed") failed.set(id, outcome.error);
    }
    return { verifiedTxIds: verified, failedTxIds: failed, txResults: results };
  }, [txIds, lookupVersion]);

  return (
    <TodayPanelView
      data={data ?? null}
      // A refresh keeps showing the previous day log instead of a skeleton.
      loading={loading && !data}
      verifiedTxIds={verifiedTxIds}
      failedTxIds={failedTxIds}
      txResults={txResults}
      cardDetails={cardDetails}
    />
  );
}
