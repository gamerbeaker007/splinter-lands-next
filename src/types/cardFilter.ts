import { CardSetNameLandValid } from "./editions";
import { CardElement, CardFoil, CardRarity } from "./planner";

export type CardFilterOptions = {
  onWagon?: boolean;
  inSet?: boolean;
  rarities: CardRarity[];
  sets: CardSetNameLandValid[];
  elements: CardElement[];
  foils: CardFoil[];
  minPP: number;
};
