"use client";

import CardTile from "@/components/player-overview/deed-overview/land-deed-card/card/CardTile";
import { WorkerPlanPick } from "@/types/landManager";
import { cardElementColorMap } from "@/types/planner/primitives";
import { Box, Tooltip, Typography } from "@mui/material";

export type WorkerMode = "rent" | "buy";

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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
        {pick.land_base_pp.toLocaleString()} PP →{" "}
        {pick.effective_pp.toLocaleString()} eff
      </Typography>
      <Typography variant="caption" sx={{ display: "block" }}>
        {pick.buy_price_per_day !== undefined && pick.rental_days !== undefined
          ? `${fmtDec(pick.buy_price_per_day)} DEC/day × ${pick.rental_days} d = ${fmtDec(pick.total_dec)} DEC`
          : `${fmtDec(pick.total_dec)} DEC`}
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
  picks: WorkerPlanPick[];
  /** "rent" shows per-day pricing; "buy" shows the one-time DEC price. */
  mode: WorkerMode;
}

/** Shared picks cell for the rental and buy confirm tables. */
export default function WorkerCardPicksCell({ picks, mode }: Props) {
  if (picks.length === 0) return null;

  // Rent shows DEC/day per card; buy shows the one-time DEC price.
  const perCard = (pick: WorkerPlanPick) =>
    mode === "rent" ? (pick.buy_price_per_day ?? 0) : pick.total_dec;
  const unit = mode === "rent" ? "DEC/day" : "DEC";
  const total = picks.reduce((s, p) => s + perCard(p), 0);

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
                actual_bcx={pick.bcx}
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
              {perCard(pick).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              {unit}
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
                maximumFractionDigits: 3,
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
        {fmtDec(total)} {unit} (Total)
      </Typography>
    </Box>
  );
}
