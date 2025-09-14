export type SplMarketAsset = {
  assetName: string;
  assetDescription: string;
  detailId: string;
  detailName: string;
  detailImage: string;
  detailIcon: string;
  detailFilterIcon: string | null;
  detailDescription: string;
  numCirculation: number;
  numListed: number;
  prices: {
    currency: string;
    minPrice: number;
  }[];
};
