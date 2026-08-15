/**
 * A player's liquidity position in ONE resource pool, as returned by
 * `/land/liquidity/pools/<player>/<RESOURCE>`.
 *
 * Both figures are LP *shares*, not resource units — converting them to
 * resource/DEC amounts needs the pool totals (see `poolPositionUtils`).
 * `vestingShares` is the slice still inside the 30-day lock; withdrawing it
 * costs a 10% penalty, so only `shares - vestingShares` is freely withdrawable.
 */
export interface SplPlayerPoolPosition {
  symbol: string;
  shares: number;
  vestingShares: number;
}

export interface SplLandPool {
  id: number;
  token_symbol: string;
  resource_quantity: string;
  resource_volume: number;
  resource_volume_1: number;
  resource_volume_30: number;
  resource_price: number;
  dec_quantity: string;
  dec_volume: number;
  dec_volume_1: number;
  dec_volume_30: number;
  dec_price: number;
  total_shares: string;
  created_date: string;
  last_updated_date: string;
}
