import { PlayerTradeHubPosition } from "@/generated/prisma/client";

export function prepareTradeHubPools(
  tokens: Record<string, PlayerTradeHubPosition[]>
) {
  return Object.entries(tokens)
    .filter(
      ([token, positions]) =>
        positions.length > 0 && !token.split("-").includes("SPS")
    )
    .map(([token, positions]) => ({
      token,
      resource: token.startsWith("DEC-") ? token.slice(4) : token,
      positions,
      ranked: [...positions]
        .filter((position) => typeof position.share_percentage === "number")
        .sort((a, b) => b.share_percentage - a.share_percentage),
    }));
}

export function playerPoolStanding(
  positions: PlayerTradeHubPosition[],
  ranked: PlayerTradeHubPosition[],
  player: string
) {
  const position = positions.find((entry) => entry.player === player);
  const index = ranked.findIndex((entry) => entry.player === player);
  return { position, rank: index === -1 ? null : index + 1 };
}
