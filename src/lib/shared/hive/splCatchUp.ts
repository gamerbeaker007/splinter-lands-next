/**
 * How long Splinterlands takes to process a broadcast op, given how far it
 * trails the Hive head. Pure; shared by the sequencer (poll pacing), the
 * run-time estimate in the dialogs and the confirmation timeouts.
 *
 * SPL doesn't follow Hive block by block: it sits for a while, then works
 * through a burst of blocks. Calibrate with `npm run spl:catchup`.
 */

/** Hive's block interval. */
export const HIVE_BLOCK_SECONDS = 3;

/** SPL's processing speed while behind (measured 0.75 on 2026-10-30, `npm run spl:catchup`). */
export const SPL_CATCHUP_BLOCKS_PER_SECOND = 0.7;

/** Keychain popup + signing + broadcast, per batch. */
const SIGN_SECONDS = 5;

/**
 * Seconds until SPL has processed an op broadcast now, `blocksBehind` blocks
 * behind the head: the op lands in the next block, so SPL has to work through
 * `blocksBehind + 1` blocks — and never sooner than that block exists.
 */
export function splConfirmSeconds(blocksBehind: number): number {
  return Math.max(
    HIVE_BLOCK_SECONDS,
    (Math.max(0, blocksBehind) + 1) / SPL_CATCHUP_BLOCKS_PER_SECOND
  );
}

/**
 * Between batches: the previous one gets into a block (~1 block) plus the
 * one-block margin of `waitForInclusion`.
 */
const INCLUSION_SECONDS = 2 * HIVE_BLOCK_SECONDS;

/**
 * Expected duration of a run of `batches` batches, starting `blocksBehind`
 * behind: each batch is signed and (except the last) waits to be in a block;
 * SPL's lag is waited for once, at the end.
 */
export function estimateRunSeconds(
  batches: number,
  blocksBehind: number
): number {
  if (batches <= 0) return 0;
  return (
    batches * SIGN_SECONDS +
    (batches - 1) * INCLUSION_SECONDS +
    splConfirmSeconds(blocksBehind)
  );
}
