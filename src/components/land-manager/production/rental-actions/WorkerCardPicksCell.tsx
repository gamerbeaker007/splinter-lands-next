"use client";

import CardTile from "@/components/player-overview/deed-overview/land-deed-card/card/CardTile";
import { formatFixed, formatNumber } from "@/lib/formatters";
import { dec_icon_url } from "@/lib/shared/statics_icon_urls";
import { WorkerPlanPick } from "@/types/landManager";
import { cardElementColorMap } from "@/types/planner/primitives";
import { Box, Stack, Tooltip, Typography } from "@mui/material";

export type WorkerMode = "rent" | "buy";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function PickTooltip({ pick }: { pick: WorkerPlanPick }) {
  const element = cardElementColorMap[pick.color.toLowerCase()] ?? pick.color;
  const foilLabel = pick.gold ? "Gold Foil" : "Regular Foil";
  const biome =
    pick.biome_modifier > 0
      ? ` · +${Math.round(pick.biome_modifier * 100)}% biome`
      : "";

  return (
    <Box sx={{ lineHeight: 1.7 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: "bold", display: "block" }}
      >
        {pick.card_name}
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        lvl {pick.level} · {capitalize(element)} · {foilLabel}
        {biome}
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        {formatNumber(pick.land_base_pp)} PP → {formatNumber(pick.effective_pp)}{" "}
        eff
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        {pick.buy_price_per_day !== undefined && pick.rental_days !== undefined
          ? `${formatFixed(pick.buy_price_per_day)} DEC/day × ${pick.rental_days} d = ${formatFixed(pick.total_dec)} DEC`
          : `${formatFixed(pick.total_dec)} DEC`}
      </Typography>
      <Typography
        variant="caption"
        sx={{ display: "block", color: "text.secondary" }}
      >
        {formatFixed(pick.pp_per_dec)} PP/DEC · seller {pick.seller}
      </Typography>
    </Box>
  );
}

interface Props {
  picks: WorkerPlanPick[];
  /** "rent" shows per-day pricing; "buy" shows the one-time DEC price. */
  mode: WorkerMode;
  selectedPPByUid?: Record<string, { basePP: number; boostedPP: number }>;
}

/** Shared picks cell for the rental and buy confirm tables. */
export default function WorkerCardPicksCell({
  picks,
  mode,
  selectedPPByUid = {},
}: Props) {
  if (picks.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        overflowX: "auto",
        maxWidth: "100%",
      }}
    >
      {picks.map((pick) => (
        <Box key={pick.card_uid} sx={{ flex: "0 0 85px", width: 85 }}>
          <Tooltip title={<PickTooltip pick={pick} />} placement="top" arrow>
            <CardTile
              name={pick.card_name}
              rarity={pick.rarity}
              edition={pick.edition}
              foil={pick.foil}
              terrain_boost={Number(pick.biome_modifier)}
              actual_bcx={pick.bcx}
              max_bcx={pick.max_bcx}
              base_pp={Number(pick.land_base_pp)}
              boosted_pp={Number(
                selectedPPByUid[pick.card_uid]?.boostedPP ?? pick.effective_pp
              )}
              uid={pick.card_uid}
            />
          </Tooltip>
          {/* Own backdrop: the cell also sits on top of plot artwork. */}
          <Stack
            spacing={0.25}
            sx={{
              textAlign: "left",
              mt: 0.4,
              px: 0.5,
              py: 0.25,
              borderRadius: 0.5,
              bgcolor: "rgba(0,0,0,0.75)",
              color: "#fff",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <Typography variant="caption" fontWeight={700} noWrap>
                {formatFixed(
                  mode === "rent"
                    ? (pick.buy_price_per_day ?? 0)
                    : pick.total_dec
                )}
              </Typography>
              <Box
                component="img"
                src={dec_icon_url}
                alt="DEC"
                sx={{ width: 14, height: 14, objectFit: "contain" }}
              />
              {mode === "rent" && (
                <Typography variant="caption" fontWeight={700} noWrap>
                  /day
                </Typography>
              )}
            </Stack>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.75)" }}
              noWrap
            >
              {formatNumber(
                (selectedPPByUid[pick.card_uid]?.boostedPP ??
                  pick.effective_pp) / (pick.total_dec || 1),
                { maximumFractionDigits: 1 }
              )}{" "}
              PP/DEC
            </Typography>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
