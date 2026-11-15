"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getTodayLogs } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getSettledTxOutcome,
  lookupTxOutcome,
} from "@/lib/frontend/settledTxOutcomes";
import { TodayLogs } from "@/types/landManager";
import { SplTrxResult } from "@/types/spl/trx";
import { useEffect, useMemo, useState } from "react";

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

export function useTodayPanelData(username: string, refreshKey: number) {
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10));
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    const timer = setTimeout(
      () => setDay(new Date().toISOString().slice(0, 10)),
      tomorrow.getTime() - Date.now() + 100
    );
    return () => clearTimeout(timer);
  }, [day]);

  const { data, loading, error } = useAsyncData(
    username ? `today-logs:${username}:${day}:${refreshKey}` : null,
    () => getTodayLogs(),
    { keepPreviousData: false, errorMessage: "Failed to load today's activity" }
  );
  const [lookupVersion, setLookupVersion] = useState(0);
  const txIds = useMemo(() => loggedTxIds(data), [data]);

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

  const { verifiedTxIds, failedTxIds, txResults } = useMemo(() => {
    void lookupVersion;
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

  return { data, loading, error, verifiedTxIds, failedTxIds, txResults };
}
