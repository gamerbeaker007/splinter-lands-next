"use client";

import { enrichDeedsWithStakedAssets } from "@/lib/backend/actions/player/enriched-deed-actions";
import { DeedComplete } from "@/types/deed";
import { useCallback, useEffect, useRef, useState } from "react";

/** What phase 1 has to return for the enrichment phase to take over. */
export interface DeedPage {
  deeds: DeedComplete[];
  total: number;
  warning: string | null;
}

export interface ProgressiveDeeds {
  deeds: DeedComplete[];
  loading: boolean;
  error: string | null;
  loadingText: string | null;
  /** Enrichment progress as a percentage of `total`. */
  progress: number;
  total: number;
  warning: string | null;
  refetch: () => void;
}

/**
 * Two-phase deed loading with progress indication:
 * Phase 1 — `fetchPage` returns the filtered deeds without staked assets.
 * Phase 2 — staked assets are enriched in batches, reporting progress.
 *
 * Everything the old per-screen versions reset at the start of a request
 * (deeds, totals, warning, progress, loading text) lives in one snapshot
 * tagged with the request it belongs to, and is *derived* when the tag no
 * longer matches. That keeps the effect free of synchronous state writes
 * (`react-hooks/set-state-in-effect`) and makes stale responses impossible to
 * apply, instead of each screen hand-rolling a request-id guard.
 *
 * `key` is null when there is nothing to load. `fetchPage` is read through a
 * ref, so an inline closure is fine — but everything it depends on must be
 * part of `key`.
 */
export function useProgressiveDeeds(
  key: string | null,
  fetchPage: () => Promise<DeedPage>,
  phaseOneText: string,
  errorText = "An error occurred while loading deeds."
): ProgressiveDeeds {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const fetchRef = useRef(fetchPage);
  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const tag = key === null ? null : `${reloadToken}\u0000${key}`;
  const current = tag !== null && snapshot?.tag === tag ? snapshot : null;

  useEffect(() => {
    if (tag === null) return;

    let cancelled = false;
    const update = (next: Snapshot) => {
      if (!cancelled) setSnapshot(next);
    };

    void (async () => {
      try {
        const page = await fetchRef.current();
        if (cancelled) return;

        const base: Snapshot = {
          tag,
          deeds: page.deeds,
          total: page.total,
          warning: page.warning,
          enriched: 0,
          error: null,
          done: page.deeds.length === 0,
        };
        update(base);

        const enriched: DeedComplete[] = [];
        for (let i = 0; i < page.deeds.length; i += BATCH_SIZE) {
          const batch = await enrichDeedsWithStakedAssets(
            page.deeds.slice(i, i + BATCH_SIZE)
          );
          if (cancelled) return;
          enriched.push(...batch);
          // Only the counter moves per batch; re-publishing the deed list
          // here would re-render the whole table on every round trip.
          update({ ...base, enriched: enriched.length });
        }

        update({
          ...base,
          deeds: enriched,
          enriched: enriched.length,
          done: true,
        });
      } catch (err) {
        if (cancelled) return;
        console.error(`${errorText}:`, err);
        update({
          tag,
          deeds: [],
          total: 0,
          warning: null,
          enriched: 0,
          error: err instanceof Error ? err.message : errorText,
          done: true,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tag, errorText]);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  const loading = tag !== null && !current?.done;
  const total = current?.total ?? 0;

  return {
    deeds: current?.deeds ?? NO_DEEDS,
    loading,
    error: current?.error ?? null,
    loadingText: describe(current, loading, phaseOneText, errorText),
    progress: total > 0 ? ((current?.enriched ?? 0) / total) * 100 : 0,
    total,
    warning: current?.warning ?? null,
    refetch,
  };
}

/** Deeds per enrichment round trip; the server action parallelises within. */
const BATCH_SIZE = 10;

const NO_DEEDS: DeedComplete[] = [];

interface Snapshot {
  tag: string;
  deeds: DeedComplete[];
  total: number;
  warning: string | null;
  /** How many deeds have come back enriched so far. */
  enriched: number;
  error: string | null;
  done: boolean;
}

function describe(
  current: Snapshot | null,
  loading: boolean,
  phaseOneText: string,
  errorText: string
): string | null {
  if (current?.error) return errorText;
  if (!loading) return null;
  if (current === null) return phaseOneText;
  return `Fetching staked assets... ${current.enriched} / ${current.total}`;
}
