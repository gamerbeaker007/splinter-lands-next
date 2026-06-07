"use client";

import CardTile from "@/components/player-overview/deed-overview/land-deed-card/card/CardTile";
import { RentalPlanPick } from "@/types/landManager";
import { cardElementColorMap } from "@/types/planner/primitives";
import { Box, Tooltip, Typography } from "@mui/material";

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function PickTooltip({ pick }: { pick: RentalPlanPick }) {
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
        {pick.land_base_pp.toLocaleString()} PP →{" "}
        {pick.effective_pp.toLocaleString()} eff
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        {fmtDec(pick.buy_price_per_day)} DEC/day × {pick.rental_days} d ={" "}
        {fmtDec(pick.total_dec)} DEC
      </Typography>
      <Typography
        variant="caption"
        sx={{ display: "block", color: "text.secondary" }}
      >
        {fmtDec(pick.pp_per_dec)} PP/DEC · seller {pick.seller}
      </Typography>
    </Box>
  );
}

interface Props {
  picks: RentalPlanPick[];
}

export default function CardPicksCell({ picks }: Props) {
  if (picks.length === 0) return null;

  const totalDecPerDay = picks.reduce((s, p) => s + p.buy_price_per_day, 0);

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "flex-start" }}>
        {picks.map((pick) => (
          <Box key={pick.card_uid}>
            <Tooltip title={<PickTooltip pick={pick} />} placement="top" arrow>
              <CardTile
                key={pick.card_uid}
                name={pick.card_name}
                rarity={pick.rarity}
                edition={pick.edition}
                foil={pick.foil}
                terrain_boost={Number(pick.biome_modifier)}
                actual_bcx={pick.bxc}
                max_bcx={pick.max_bcx}
                base_pp={Number(pick.land_base_pp)}
                boosted_pp={Number(pick.effective_pp)}
                uid={pick.card_uid}
              />
            </Tooltip>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                color: "text.secondary",
                mt: 0.25,
                fontSize: "0.65rem",
              }}
            >
              {pick.buy_price_per_day.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              DEC/day
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                color: "text.secondary",
                mt: 0.25,
                fontSize: "0.65rem",
              }}
            >
              {pick.pp_per_dec.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              PP/DEC
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{ display: "block", color: "text.secondary", mt: 0.25 }}
      >
        {fmtDec(totalDecPerDay)} DEC/day (Total)
      </Typography>
    </Box>
  );
}
