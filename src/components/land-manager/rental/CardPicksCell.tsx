"use client";

import { RentalPlanPick } from "@/types/landManager";
import { cardElementColorMap } from "@/types/planner/primitives";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

const IMG_W = 84;
const IMG_H = 114;

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
      <Box sx={{ display: "flex", gap: 0.25 }}>
        {picks.map((pick) => (
          <Tooltip
            key={pick.card_uid}
            title={<PickTooltip pick={pick} />}
            placement="top"
            arrow
          >
            <Box
              sx={{
                width: IMG_W,
                height: IMG_H,
                borderRadius: 0.5,
                overflow: "hidden",
                flexShrink: 0,
                bgcolor: "action.hover",
                position: "relative",
                cursor: "default",
              }}
            >
              {pick.card_image_url ? (
                <Image
                  src={pick.card_image_url}
                  alt={pick.card_name}
                  fill
                  sizes={`${IMG_W}px`}
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <Typography
                  variant="caption"
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    color: "text.secondary",
                  }}
                >
                  {pick.card_name.charAt(0)}
                </Typography>
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{ display: "block", color: "text.secondary", mt: 0.25 }}
      >
        {fmtDec(totalDecPerDay)} DEC/day
      </Typography>
    </Box>
  );
}
