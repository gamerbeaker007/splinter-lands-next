"use client";

import type { SequencerProgress } from "@/lib/shared/hive/sequencedBroadcast";

/**
 * Live state of the broadcast run in this tab, for any dialog to show
 * (`useBroadcastProgress`). Kept outside React on purpose: the run is a plain
 * promise that keeps going when the dialog that started it closes, so the
 * status must outlive that component.
 *
 * While a run is active, leaving the page asks for confirmation — closing the
 * tab is the one thing that really stops a run between batches.
 */

export interface BroadcastRunState extends Partial<SequencerProgress> {
  player: string;
  totalBatches: number;
  startedAt: number;
}

let state: BroadcastRunState | null = null;
/** Identifies the active run; progress updates replace `state`, not this. */
let activeRun: symbol | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  event.preventDefault();
  // Legacy browsers only show the prompt when returnValue is set.
  event.returnValue = "";
}

function hasWindowEvents(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function"
  );
}

/**
 * Marks a run as started. `update` publishes its progress and `end` clears it;
 * both are no-ops once a newer run has taken over.
 */
export function beginBroadcastRun(
  player: string,
  totalBatches: number
): { update: (progress: SequencerProgress) => void; end: () => void } {
  const run = Symbol("broadcast-run");
  activeRun = run;
  state = { player, totalBatches, startedAt: Date.now() };
  if (hasWindowEvents()) {
    window.addEventListener("beforeunload", onBeforeUnload);
  }
  emit();
  return {
    update: (progress) => {
      if (activeRun !== run || !state) return;
      state = { ...state, ...progress };
      emit();
    },
    end: () => {
      if (activeRun !== run) return;
      activeRun = null;
      state = null;
      if (hasWindowEvents()) {
        window.removeEventListener("beforeunload", onBeforeUnload);
      }
      emit();
    },
  };
}

export function subscribeBroadcastRun(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBroadcastRun(): BroadcastRunState | null {
  return state;
}
