/**
 * Visual summary of what an action is about to do.
 *
 * Every bulk action can already produce its plan without broadcasting; the plan
 * is a list of log lines meant to be read step by step. These types carry the
 * same plan a second way — summed per strategy, so the config dialog can show
 * at a glance what pressing the button is expected to yield before anyone reads
 * the exact steps.
 */

/** One resource (or DEC) amount on either side of a preview row. */
export interface ActionPreviewAmount {
  /** Resource symbol, e.g. GRAIN or DEC. */
  symbol: string;
  /** Always positive; the side it sits on gives it its sign and colour. */
  amount: number;
}

/**
 * One strategy's expected contribution.
 *
 * `spend` is what leaves the player's holdings (rendered red, negative) and
 * `receive` is what it turns into (rendered green, positive). A row can carry
 * only one side: a pool withdrawal costs nothing, a pool deposit yields nothing
 * back on the spot.
 */
export interface ActionPreviewRow {
  /** Stable key, usually the strategy name. */
  key: string;
  label: string;
  spend: ActionPreviewAmount[];
  receive: ActionPreviewAmount[];
}
