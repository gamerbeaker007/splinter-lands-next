"use client";

import { playerPoolStanding, prepareTradeHubPools } from "./poolRankings";
import { formatFixed, formatNumber } from "@/lib/formatters";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { Box, Card, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

type Props = {
  pool: ReturnType<typeof prepareTradeHubPools>[number];
  player: string;
};

export function PlayerPoolSummaryCard({ pool, player }: Props) {
  const resourceIcon = RESOURCE_ICON_MAP[pool.resource];
  const { position, rank } = playerPoolStanding(
    pool.positions,
    pool.ranked,
    player
  );
  const card = (
    <Card
      variant="outlined"
      role="group"
      aria-label={`${pool.token} pool`}
      sx={{ p: 1.5, minWidth: 160, flex: 1, position: "relative" }}
      tabIndex={position ? 0 : undefined}
    >
      {resourceIcon ? (
        <Image
          src={resourceIcon}
          alt=""
          width={64}
          height={64}
          style={{
            position: "absolute",
            right: 40,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
      ) : (
        <Typography variant="caption">{pool.resource}</Typography>
      )}
      {position ? (
        <Box
          display="grid"
          gridTemplateColumns="auto 1fr"
          columnGap={1}
          sx={{ fontVariantNumeric: "tabular-nums", position: "relative" }}
        >
          <Typography variant="body2">Position:</Typography>
          <Typography variant="body2" textAlign="right">
            {rank === null ? "Unranked" : `#${rank}`}
          </Typography>
          <Typography variant="body2">Share:</Typography>
          <Typography variant="body2" textAlign="right">
            {formatFixed(position.share_percentage, 3)}%
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" position="relative">
          Not in snapshot
        </Typography>
      )}
    </Card>
  );

  return (
    <Box display="flex">
      {position ? (
        <Tooltip
          describeChild
          title={
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                {resourceIcon && (
                  <Image src={resourceIcon} alt="" width={18} height={18} />
                )}
                <span>
                  {pool.resource}: {formatNumber(position.resource_quantity)}
                </span>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Image
                  src={RESOURCE_ICON_MAP.DEC}
                  alt=""
                  width={18}
                  height={18}
                />
                <span>DEC: {formatNumber(position.dec_quantity)}</span>
              </Stack>
            </Stack>
          }
        >
          {card}
        </Tooltip>
      ) : (
        card
      )}
    </Box>
  );
}
