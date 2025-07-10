import { ProductionPoints } from "./productionPoints";

export type CompareProductionPoint = {
  method: "plot" | "tract" | "region";
  totalPP: {
    rawPP: number;
    boostedPP: number;
  };
  perResource: Record<string, Record<string, ProductionPoints>>;
};
