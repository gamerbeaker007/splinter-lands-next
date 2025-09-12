export type SplTax = {
  balance: number;
  token: string;
};

export type SplTaxes = {
  taxes: SplTax[];
  capacity: number;
};
