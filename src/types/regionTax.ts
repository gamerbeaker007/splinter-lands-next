export type TaxOwner = {
  regionUid: string;
  regionNumber: number;
  tractNumber?: number;
  plotNumber?: number;
  player?: string;
  captureRate?: number;
};

export type TractTax = {
  keepOwner: TaxOwner;
  resourceRewardsPerHour: Record<string, number>; // rewards per hour per resource
  capturedTaxInResource: Record<string, number>; // rewards per hour per resource in resource amount
  capturedTaxInDEC: Record<string, number>; // rewards per hour per resource in DEC value
};

export type RegionTax = {
  castleOwner: TaxOwner;
  resourceRewardsPerHour: Record<string, number>; // rewards per hour per resource
  capturedTaxInResource: Record<string, number>; // rewards per hour per resource in resource amount
  capturedTaxInDEC: Record<string, number>; // rewards per hour per resource in DEC value
  perTract: Record<string, TractTax>;
};
