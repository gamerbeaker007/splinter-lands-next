import { WorksiteType } from "@/types/planner";

export type DeedChangeType =
  | "remove_worker"
  | "add_worker"
  | "update_worksite"
  | "add_title"
  | "update_title"
  | "add_totem"
  | "update_totem"
  | "add_powercore"
  | "update_powercore";

export interface DeedChange {
  id: string; // unique change ID
  timestamp: number;
  deedUid: string;
  changeType: DeedChangeType;
  workerSlot?: number; // 1-5 for worker changes
  cardUid?: string; // card being added/removed
  worksite?: WorksiteType;
  totemTier?: string;
  titleTier?: string;
  powercoreUid?: string;
  description: string; // human-readable description
}

export interface DeedAssignment {
  deedUid: string;
  worksite: WorksiteType | null;
  powercoreUid: string | null;
  totemTier: string;
  titleTier: string;
  workers: {
    slot1: string | null;
    slot2: string | null;
    slot3: string | null;
    slot4: string | null;
    slot5: string | null;
  };
}
