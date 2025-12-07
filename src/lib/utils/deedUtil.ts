import { SPL_WEB_URL } from "@/lib/shared/statics_icon_urls";

const BASE_URL = "https://next.splinterlands.com/assets/lands/deedsSurveyed";

export function getManageLinkPlot(regionNumber: number, plotId: number) {
  return `https://splinterlands.com/land/overview/praetoria/${regionNumber}/${plotId}`;
}

export function getHarvestRegion(region_number: number) {
  return `https://splinterlands.com/land/praetoria/${region_number}/production/claim`;
}

export function getDeedImg(
  magicType: string,
  deedType: string,
  plotStatus: string,
  rarity: string,
  worksiteType?: string
) {
  if (plotStatus.toLowerCase() === "magical" && magicType) {
    return `${BASE_URL}/${deedType.toLowerCase()}_${plotStatus.toLowerCase()}_${magicType.toLowerCase()}_${rarity.toLowerCase()}.jpg`;
  } else if (plotStatus.toLowerCase() === "kingdom") {
    return `${BASE_URL}/${deedType.toLowerCase()}_${plotStatus.toLowerCase()}_${worksiteType?.toLowerCase()}.jpg`;
  } else {
    return `${BASE_URL}/${deedType.toLowerCase()}_${plotStatus.toLowerCase()}_${rarity.toLowerCase()}.jpg`;
  }
}

export function getDeedGeographyImg(deedType: string) {
  const path = "assets/lands/deedAssets/";
  return deedType.toLowerCase() === "unsurveyed deed"
    ? null
    : `${SPL_WEB_URL}${path}img_geography-emblem_${deedType.toLowerCase()}.svg`;
}
