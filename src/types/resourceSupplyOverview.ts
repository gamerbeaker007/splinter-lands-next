export type ResourceSupplyOverview = {
  date: Date;
  resource: {
    [key: string]: {
      supply: number;
      trade_hub_supply: number;
      daily_production: number;
      daily_consume: number;
      consumes: {
        grain: number;
        wood: number;
        stone: number;
        iron: number;
      };
    };
  };
};
