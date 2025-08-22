import { CardElement, DeedType } from "@/types/planner";

export const TERRAIN_BONUS: Record<
  DeedType,
  Partial<Record<CardElement, number>>
> = {
  Badlands: { Fire: 0.1, Life: -0.5, Death: 0.1, Earth: -0.5 },
  Bog: { Fire: -0.5, Water: 0.1, Life: -0.5, Death: 0.1 },
  Caldera: { Fire: 0.1, Death: -0.5, Earth: -0.5, Dragon: 0.1 },
  Canyon: {
    Fire: 0.1,
    Water: -0.5,
    Life: -0.5,
    Death: 0.1,
    Earth: -0.5,
    Dragon: 0.1,
  },
  Desert: { Fire: 0.1, Water: -0.5, Life: -0.5, Dragon: 0.1 },
  Forest: { Life: 0.1, Death: -0.5, Earth: 0.1, Dragon: -0.5 },
  Hills: { Water: -0.5, Life: 0.1, Death: -0.5, Dragon: 0.1 },
  Jungle: { Life: 0.1, Death: -0.5, Earth: 0.1, Dragon: -0.5 },
  Lake: { Fire: -0.5, Water: 0.1, Earth: 0.1, Dragon: -0.5 },
  Mountain: { Fire: 0.1, Water: -0.5, Death: 0.1, Earth: -0.5 },
  Plains: { Water: -0.5, Life: 0.1, Earth: -0.5, Dragon: 0.1 },
  River: { Fire: -0.5, Water: 0.1, Earth: 0.1, Dragon: -0.5 },
  Swamp: { Fire: -0.5, Water: 0.1, Life: -0.5, Death: 0.1 },
  Tundra: {
    Fire: -0.5,
    Water: 0.1,
    Life: 0.1,
    Death: -0.5,
    Earth: 0.1,
    Dragon: -0.5,
  },
};

export const TERRAIN_OPTIONS: DeedType[] = Object.keys(
  TERRAIN_BONUS,
) as DeedType[];
