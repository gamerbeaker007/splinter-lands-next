import { CardSetNameLandValid } from "./editions";
import { CardElement, CardRarity } from "./planner";

export type CardFilterOptions = {
  onWagon?: boolean;
  inSet?: boolean;
  rarities: CardRarity[];
  sets: CardSetNameLandValid[];
  elements: CardElement[];
  minPP: number;
};
