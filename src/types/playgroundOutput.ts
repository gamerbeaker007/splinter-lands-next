import { Resource } from "@/constants/resource/resource";

export type PlaygroundSummary = {
  totalBasePP: number;
  totalBoostedPP: number;
  perResource: Record<
    Resource,
    {
      pp: number;
      produced: number;
      consumed: number;
      net: number;
    }
  >;
  totalNetDEC: number;
};
