"use client";

import { useCardDetailsAction } from "@/hooks/useCardDetails";
import { getTodayLogs } from "@/lib/backend/actions/land-manager/log-actions";
import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import { TodayLogs } from "@/types/landManager";
import { SplTrxResult } from "@/types/spl/trx";
import { useEffect, useRef, useState } from "react";
import TodayPanelView from "./TodayPanelView";

export default function TodayPanel({
  refreshKey = 0,
}: {
  refreshKey?: number;
}) {
  const [data, setData] = useState<TodayLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifiedTxIds, setVerifiedTxIds] = useState<Set<string>>(new Set());
  const [failedTxIds, setFailedTxIds] = useState<Map<string, string>>(
    new Map()
  );
  const [txResults, setTxResults] = useState<Map<string, SplTrxResult>>(
    new Map()
  );
  const { cardDetails } = useCardDetailsAction();
  // Persist across refreshes — once a tx is settled it never needs re-lookup
  const persistentVerified = useRef<Set<string>>(new Set());
  const persistentFailed = useRef<Map<string, string>>(new Map());
  // The parsed payload of each confirmed tx — the only source for what the
  // engine actually awarded (totem fragments, Labor's Luck cards).
  const persistentResults = useRef<Map<string, SplTrxResult>>(new Map());

  useEffect(() => {
    let cancelled = false;
    getTodayLogs().then((d) => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!data) return;
    const allTxIds = [
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
    ];
    const unique = [...new Set(allTxIds)];
    if (unique.length === 0) return;

    const publish = () => {
      setVerifiedTxIds(new Set(persistentVerified.current));
      setFailedTxIds(new Map(persistentFailed.current));
      setTxResults(new Map(persistentResults.current));
    };

    // Immediately reflect already-known outcomes without any API call
    publish();

    const toPoll = unique.filter(
      (id) =>
        !persistentVerified.current.has(id) && !persistentFailed.current.has(id)
    );
    if (toPoll.length === 0) return;

    let cancelled = false;

    async function lookupAll(ids: string[]) {
      await Promise.all(
        ids.map(async (txId) => {
          const outcome = await lookupTransaction(txId);
          if (outcome.status === "success") {
            persistentVerified.current.add(txId);
            persistentResults.current.set(txId, outcome.result);
          } else if (outcome.status === "failed")
            persistentFailed.current.set(txId, outcome.error);
        })
      );
    }

    async function poll(ids: string[]) {
      await lookupAll(ids);
      if (cancelled) return;
      publish();

      const remaining = ids.filter(
        (id) =>
          !persistentVerified.current.has(id) &&
          !persistentFailed.current.has(id)
      );
      if (remaining.length === 0) return;
      await new Promise((r) => setTimeout(r, 5000));
      if (cancelled) return;
      await lookupAll(remaining);
      if (!cancelled) publish();
    }

    poll(toPoll);
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <TodayPanelView
      data={data}
      loading={loading}
      verifiedTxIds={verifiedTxIds}
      failedTxIds={failedTxIds}
      txResults={txResults}
      cardDetails={cardDetails}
    />
  );
}
