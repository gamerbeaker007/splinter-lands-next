import { Resource } from "@/constants/resource/resource";

export type ResourceWithDEC = {
  resource: Resource;
  amount: number;
  buyPriceDEC: number;
  sellPriceDEC: number;
};

export type ProductionInfo = {
  consume: ResourceWithDEC[]; // zero, one, or multiple resources
  produce: ResourceWithDEC; // only one resource produced, or null if nothing
  netDEC: number;
};
