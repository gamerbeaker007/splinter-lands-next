import { titleIconMapOnTitle } from "@/lib/shared/statics";
import {
  land_default_off_icon_url_placeholder,
  land_hammer_icon_url,
  land_mythic_icon_url,
  land_unsurveyd_deed_url,
  SPL_WEB_URL,
} from "@/lib/shared/statics_icon_urls";

const BASE_URL = "https://next.splinterlands.com/assets/lands/deedsSurveyed";

export function getManageLinkPlot(regionNumber: number, plotId: number) {
  return `https://splinterlands.com/land/overview/praetoria/${regionNumber}/${plotId}`;
}

export function getLandManagerProductionLink(
  regionNumber: number,
  tractNumber: number,
  plotNumber: number
) {
  return `/land-manager/production?region=${regionNumber}&tract=${tractNumber}&plot=${plotNumber}`;
}

export function getPlannerLink(plotID: number) {
  return `/planning?plot=${plotID}`;
}

export function getWorksiteLink(regionNumber: number, plotId: number) {
  return `https://splinterlands.com/land/overview/praetoria/${regionNumber}/${plotId}/worksite`;
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
  if (deedType.toLowerCase() === "unsurveyed deed") {
    return land_unsurveyd_deed_url;
  } else if (plotStatus.toLowerCase() === "magical" && magicType) {
    return `${BASE_URL}/${deedType.toLowerCase()}_${plotStatus.toLowerCase()}_${magicType.toLowerCase()}_${rarity.toLowerCase()}.jpg`;
  } else if (plotStatus.toLowerCase() === "kingdom") {
    return `${BASE_URL}/${deedType.toLowerCase()}_${plotStatus.toLowerCase()}_${worksiteType?.toLowerCase()}.jpg`;
  } else {
    return `${BASE_URL}/${deedType.toLowerCase()}_${plotStatus.toLowerCase()}_${rarity.toLowerCase()}.jpg`;
  }
}

/** Side-menu rarity icon, e.g. "common" → commonOff.svg (mythic reuses legendary). */
export function getDeedRarityIcon(rarity: string): string {
  const name = rarity.toLowerCase();
  return name === "mythic"
    ? land_mythic_icon_url
    : land_default_off_icon_url_placeholder.replace("__NAME__", name);
}

/** Side-menu plot status icon, e.g. "natural" → naturalOff.svg. */
export function getPlotStatusIcon(plotStatus: string): string {
  return land_default_off_icon_url_placeholder.replace(
    "__NAME__",
    plotStatus.toLowerCase()
  );
}

export function getDeedGeographyImg(deedType: string) {
  const path = "assets/lands/deedAssets/";
  return deedType.toLowerCase() === "unsurveyed deed"
    ? null
    : `${SPL_WEB_URL}${path}img_geography-emblem_${deedType.toLowerCase()}.svg`;
}

export function getTitleIcon(name: string) {
  const normalized = name.toLowerCase().startsWith("the ")
    ? name.slice(4).toLowerCase()
    : name.toLowerCase();
  return (
    titleIconMapOnTitle[normalized.replace(/ /g, "_")] ?? land_hammer_icon_url
  );
}
