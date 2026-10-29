/**
 * Every Splinterlands API path the app calls, grouped by host. Paths are
 * relative to the host's base URL (`splApiConfig`) and carry no query string —
 * callers pass parameters themselves.
 *
 * The same constants are used by the server axios clients, the worker and the
 * browser (`lib/frontend/spl-browser-api.ts`). Which side calls an endpoint is
 * decided per data type in CLAUDE.md, not here. Search for a constant to find
 * every caller of that endpoint.
 */

const enc = encodeURIComponent;

/** `SPL_API_BASE` (api.splinterlands.com). */
export const SPL_API = {
  // Auth
  LOGIN: "/players/v2/login",
  /** JWT — used only to verify a token server-side. */
  PLAYER_BALANCE_HISTORY: "/players/balance_history",

  // Global / shared data
  SETTINGS: "/settings",
  LAST_BLOCK: "/last_block",
  CARD_DETAILS: "/cards/get_details",
  MARKET_FOR_SALE_GROUPED: "/market/for_sale_grouped",
  MARKET_FOR_RENT_GROUPED: "/market/for_rent_grouped",
  MARKET_QUERY_BY_CARD: "/market/market_query_by_card",
  TRANSACTION_LOOKUP: "/transactions/lookup",

  // Per player
  PLAYER_BALANCES: "/players/balances",
  PLAYER_INVENTORY: "/players/inventory",
  PLAYER_AUTHORITIES: "/players/authorities",
  CARDS_COLLECTION: (player: string) => `/cards/collection/${enc(player)}`,
} as const;

/** `SPL_VAPI_BASE` (vapi.splinterlands.com). */
export const SPL_VAPI = {
  // Deeds
  LAND_DEEDS: "/land/deeds",
  LAND_DEED: (plotId: number | string) => `/land/deeds/${enc(plotId)}`,
  LAND_STAKED_ASSETS: (deedUid: string) =>
    `/land/stake/deeds/${enc(deedUid)}/assets`,
  LAND_TAXES: (deedUid: string) => `/land/resources/taxes/${enc(deedUid)}`,
  LAND_DEED_PROJECTS: (deedUid: string) =>
    `/land/projects/deed/${enc(deedUid)}/list`,
  LAND_DEED_REWARD_ACTIONS: (deedUid: string) =>
    `/land/resources/rewardactions/${enc(deedUid)}`,

  // Stake items / cards
  LAND_STAKE_ITEMS_GROUPED: (stakeTypeUid: string) =>
    `/land/stake/items/${enc(stakeTypeUid)}/grouped`,
  LAND_STAKE_ITEMS_AVAILABLE: (stakeTypeUid: string) =>
    `/land/stake/items/${enc(stakeTypeUid)}/available`,
  LAND_STAKE_CARDS_GROUPED: (stakeTypeUid: string) =>
    `/land/stake/cards/${enc(stakeTypeUid)}/grouped`,
  LAND_STAKE_CARDS_AVAILABLE: (stakeTypeUid: string) =>
    `/land/stake/cards/${enc(stakeTypeUid)}/available`,

  // Liquidity
  LAND_LIQUIDITY_REGION: (player: string) =>
    `/land/liquidity/region/${enc(player)}`,
  LAND_LIQUIDITY_POOLS_ALL: (player: string) =>
    `/land/liquidity/pools/${enc(player)}/all-no-vesting`,
  LAND_LIQUIDITY_POOL: (player: string, symbol: string) =>
    `/land/liquidity/pools/${enc(player)}/${enc(symbol)}`,
  LAND_LIQUIDITY_LANDPOOLS: "/land/liquidity/landpools",

  // Resources
  LAND_RESOURCE_LEADERBOARDS: "/land/resources/leaderboards",

  // JWT-authenticated production reads
  LAND_PRODUCTION_OVERVIEW: "/land/resources/production/overview",
  LAND_REGION_HARVESTABLE: "/land/resources/production/region/harvestable",
  LAND_REGION_OVERVIEW: "/land/resources/production/region/overview",

  // Market
  MARKET_LANDING: "/market/landing",
} as const;

/** prices.splinterlands.com. */
export const SPL_PRICES_API = {
  PRICES: "/prices",
} as const;
