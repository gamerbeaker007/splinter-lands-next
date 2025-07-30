export const RESOURCES = [
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "RESEARCH",
  "AURA",
  "TAX",
  "VOUCHER",
  "SPS",
  "DEC",
] as const;
export type Resource = (typeof RESOURCES)[number];

export const CALCULATOR_RESOURCES = [
  "GRAIN",
  "WOOD",
  "STONE",
  "IRON",
  "AURA",
  "VOUCHER",
] as const;

export type CalculatorResource = (typeof CALCULATOR_RESOURCES)[number];
