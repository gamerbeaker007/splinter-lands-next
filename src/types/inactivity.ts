export interface InactivityBucket {
  label: string;
  minWeeks: number;
  maxWeeks?: number; // undefined means no upper limit
  count: number;
  deeds: InactiveDeedInfo[];
}

export interface InactiveDeedInfo {
  deed_uid: string;
  player: string | null;
  region_name: string | null;
  region_uid: string;
  plot_id: number;
  resource_symbol: string | null;
  worksite_resource_token: string | null;
  rewards_per_hour: number;
  hours_since_last_op: number;
  weeks_inactive: number;
}

export interface PlayerInactivityRanking {
  player: string;
  totalDeeds: number;
  inactiveDeeds: number;
  averageInactiveWeeks: number;
}

export interface IncorrectDeedInfo {
  deed_uid: string;
  player: string | null;
  region_name: string | null;
  plot_id: number;
  deed_resource_symbol: string | null;
  worksite_resource_token: string | null;
  hours_since_last_op: number | null;
}

export interface InactivityAnalysis {
  totalDeeds: number;
  totalWithRewards: number;
  activeDeeds: number;
  inactiveDeeds: number;
  buckets: InactivityBucket[];
  playerRankings: PlayerInactivityRanking[];
  incorrectDeeds: IncorrectDeedInfo[];
}
