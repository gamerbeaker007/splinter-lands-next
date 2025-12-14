import { LowestMarketData } from "@/types/planner/market/market";
import { getCachedCardDetailsData } from "../services/cardService";
import { getCachedMarketData } from "../services/marketService";

export async function getMarketData(): Promise<LowestMarketData> {
  const cardDetails = await getCachedCardDetailsData();
  return await getCachedMarketData(cardDetails);
}
