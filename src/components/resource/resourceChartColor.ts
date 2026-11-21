import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";

export function resourceChartColor(symbol: string): string {
  if (RESOURCE_COLOR_MAP[symbol]) return RESOURCE_COLOR_MAP[symbol];
  let hash = 0;
  for (const character of symbol) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }
  return `hsl(${hash}, 65%, 50%)`;
}
