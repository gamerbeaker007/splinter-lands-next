export interface SplSeasonInfo {
  id: number;
  name: string;
  ends: string; // ISO date
}

export interface SplSettingsResponse {
  season: SplSeasonInfo;
  next_season_end: string; // ISO date, top-level on /settings
  maintenance_mode: boolean;
}
