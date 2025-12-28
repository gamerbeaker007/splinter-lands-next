import { Resource } from "@/constants/resource/resource";

export type PlaygroundResourceOutput = {
  resource: Resource;
  produced: number;
  consumed: number;
  net: number;
};

export type PlaygroundDeedOutput = {
  deed_uid: string;
  basePP: number;
  boostedPP: number;
  resources: PlaygroundResourceOutput[];
  totalNetDEC: number;
};

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
