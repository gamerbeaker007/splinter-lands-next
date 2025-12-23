import { CalculatorResource } from "@/constants/resource/resource";

export type PresetName =
  | "wagons"
  | "auction"
  | "fortune"
  | "midnight"
  | "unbinding common"
  | "unbinding rare"
  | "unbinding epic"
  | "unbinding legendary"
  | "polymorph potion"
  | "capacity flux"
  | "clear";

export const RESOURCE_PRESETS: Record<
  PresetName,
  { input: Record<CalculatorResource, number>; decExtra: number }
> = {
  wagons: {
    input: {
      GRAIN: 0,
      WOOD: 40000,
      STONE: 10000,
      IRON: 4000,
      AURA: 2500,
      VOUCHER: 0,
    },
    decExtra: 0,
  },
  auction: {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 1000, VOUCHER: 50 },
    decExtra: 500,
  },
  fortune: {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 200, VOUCHER: 10 },
    decExtra: 200,
  },
  midnight: {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 40, VOUCHER: 0 },
    decExtra: 0,
  },
  "unbinding common": {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 100, VOUCHER: 0 },
    decExtra: 0,
  },
  "unbinding rare": {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 400, VOUCHER: 0 },
    decExtra: 0,
  },
  "unbinding epic": {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 2000, VOUCHER: 0 },
    decExtra: 0,
  },
  "unbinding legendary": {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 10000, VOUCHER: 0 },
    decExtra: 0,
  },
  "polymorph potion": {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 400, VOUCHER: 0 },
    decExtra: 0,
  },
  "capacity flux": {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 1000, VOUCHER: 0 },
    decExtra: 0,
  },
  clear: {
    input: { GRAIN: 0, WOOD: 0, STONE: 0, IRON: 0, AURA: 0, VOUCHER: 0 },
    decExtra: 0,
  },
};
