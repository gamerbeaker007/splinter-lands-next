"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A finished load, tagged with the request it belongs to. Anything that would
 * otherwise be reset at the start of a new request is derived from whether
 * this tag still matches the current one.
 */
interface Snapshot<T> {
  tag: string;
  data: T | null;
  error: string | null;
}

export interface AsyncData<T> {
  /** Result of the current request, or null while it is still in flight. */
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs `load` for the current key. */
  reload: () => void;
}

/**
 * Runs `load` whenever `key` changes, and tracks loading/error around it.
 *
 * `loading`, the error and the reset-to-empty on a null key are all *derived*
 * from whether the stored snapshot still matches the current key, so the hook
 * never writes state synchronously while the effect runs — the single write
 * happens after the awaited load settles. That is what keeps callers clear of
 * `react-hooks/set-state-in-effect` (and of the cascading render it warns
 * about) without every hook hand-rolling its own cancellation flag.
 *
 * `key` is null when there is nothing to load; the hook then stays idle with
 * `data: null, loading: false`.
 *
 * `load` receives the (non-null) key, so a single-argument server action can
 * be passed straight in. Only `key` (and `reload`) decide *when* a load runs —
 * the latest `load` is read through a ref — so an inline closure over props is
 * fine and will not cause a refetch loop. Whatever the loader reads besides
 * the key must therefore be reflected in the key.
 */
export function useAsyncData<T>(
  key: string | null,
  load: (key: string) => Promise<T>,
  errorMessage = "Failed to load data"
): AsyncData<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Read at load time rather than depended on, so callers may pass a closure.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const tag = key === null ? null : `${reloadToken}\u0000${key}`;
  const fresh = tag !== null && snapshot?.tag === tag;

  useEffect(() => {
    if (key === null || tag === null) return;

    let cancelled = false;
    void (async () => {
      try {
        const data = await loadRef.current(key);
        if (!cancelled) setSnapshot({ tag, data, error: null });
      } catch (err) {
        if (cancelled) return;
        console.error(`${errorMessage}:`, err);
        setSnapshot({
          tag,
          data: null,
          error: err instanceof Error ? err.message : errorMessage,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, tag, errorMessage]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return {
    data: fresh ? snapshot.data : null,
    error: fresh ? snapshot.error : null,
    loading: tag !== null && !fresh,
    reload,
  };
}
