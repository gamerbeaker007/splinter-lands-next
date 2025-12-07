import { CardBloodline } from "./planner";

// Land ability types
type LandAbilityWithValue = [
  "RATIONING" | "DD" | "GRAIN" | "WOOD" | "STONE" | "IRON" | "AURA",
  number,
];
type LandAbilityWithBloodLine = ["BLOODLINE", number, CardBloodline];
type LandAbilityBoolean = ["LL" | "ENERGIZED"];

type LandAbility =
  | LandAbilityWithValue
  | LandAbilityWithBloodLine
  | LandAbilityBoolean;

// Each level contains an array of abilities
type LandAbilityLevel = LandAbility[];

// The full land_abilities array contains 10 levels (one for each level)
export type LandAbilities = [
  LandAbilityLevel?, // Level 1
  LandAbilityLevel?, // Level 2
  LandAbilityLevel?, // Level 3
  LandAbilityLevel?, // Level 4
  LandAbilityLevel?, // Level 5
  LandAbilityLevel?, // Level 6
  LandAbilityLevel?, // Level 7
  LandAbilityLevel?, // Level 8
  LandAbilityLevel?, // Level 9
  LandAbilityLevel?, // Level 10
];

export type SplCardDetails = {
  id: number;
  name: string;
  color: string;
  type: string;
  sub_type: string;
  rarity: number;
  is_starter: boolean;
  editions: string;
  is_promo: boolean;
  tier?: number;
  secondary_color?: string;
  stats?: {
    land_abilities: LandAbilities;
  };
};
