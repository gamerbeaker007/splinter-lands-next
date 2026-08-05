import { dailyCache } from "@/lib/backend/cache/cache";
import { CardBloodline } from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";
import { fetchCardDetails } from "../api/spl/spl-base-api";

export function deriveCardBloodlineOptions(
  cardDetails: SplCardDetails[]
): CardBloodline[] {
  const options = Array.from(
    new Set(
      cardDetails
        .map((card) => card.sub_type?.trim())
        .filter((subType): subType is string =>
          Boolean(subType && subType.trim())
        )
    )
  ).sort((a, b) => a.localeCompare(b));

  return options as CardBloodline[];
}

export async function getCachedCardDetailsData(
  force = false
): Promise<SplCardDetails[]> {
  const key = `card-details`;
  if (!force) {
    const cached = dailyCache.get<SplCardDetails[]>(key);
    if (cached) return cached;
  }

  const data = await fetchCardDetails();
  dailyCache.set(key, data);
  return data;
}

export async function getCachedCardBloodlineOptions(
  force = false
): Promise<CardBloodline[]> {
  const key = `card-details:bloodlines`;
  if (!force) {
    const cached = dailyCache.get<CardBloodline[]>(key);
    if (cached) return cached;
  }

  const cardDetails = await getCachedCardDetailsData(force);
  const bloodlines = deriveCardBloodlineOptions(cardDetails);
  dailyCache.set(key, bloodlines);
  return bloodlines;
}
