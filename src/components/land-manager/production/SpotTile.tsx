"use client";

import { landItemIconUrl } from "@/components/player-overview/deed-overview/land-deed-card/boosts/ItemBoost";
import CardTile from "@/components/player-overview/deed-overview/land-deed-card/card/CardTile";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import { SpotCardVM, SpotItemVM } from "./productionConfigTypes";

const SPOT_WIDTH = 95;

function SpotLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", textAlign: "center", mb: 0.25 }}
    >
      {label}
    </Typography>
  );
}

function ClearButton({
  onClear,
  disabled,
}: {
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip title="Clear spot">
      <span>
        <IconButton
          size="small"
          onClick={onClear}
          disabled={disabled}
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            "&:hover": { bgcolor: "error.main", color: "common.white" },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}

/** An empty spot: dashed placeholder with a "+" to assign. */
export function EmptySpot({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Box sx={{ width: SPOT_WIDTH }}>
      <SpotLabel label={label} />
      <Box
        component="button"
        onClick={onClick}
        disabled={disabled}
        sx={{
          width: "100%",
          height: 110,
          border: "1.5px dashed",
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
          opacity: disabled ? 0.5 : 1,
          "&:hover": disabled
            ? undefined
            : { borderColor: "success.main", color: "success.main" },
        }}
      >
        <AddIcon />
      </Box>
    </Box>
  );
}

/** A filled card spot (worker / runi) rendered with the shared CardTile. */
export function FilledCardSpot({
  label,
  card,
  onClear,
  disabled,
}: {
  label: string;
  card: SpotCardVM;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <Box sx={{ width: SPOT_WIDTH }}>
      <SpotLabel label={label} />
      <Box
        sx={{ position: "relative", display: "flex", justifyContent: "center" }}
      >
        <CardTile
          name={card.name}
          rarity={card.rarity}
          edition={card.edition}
          foil={card.foil}
          terrain_boost={card.terrainBoost}
          actual_bcx={card.bcx}
          max_bcx={card.maxBcx}
          base_pp={card.basePP}
          boosted_pp={card.boostedPP}
          uid={card.uid}
        />
        <ClearButton onClear={onClear} disabled={disabled} />
      </Box>
    </Box>
  );
}

/** A filled item spot (power core / totem / title). */
export function FilledItemSpot({
  label,
  item,
  onClear,
  disabled,
}: {
  label: string;
  item: SpotItemVM;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <Box sx={{ width: SPOT_WIDTH }}>
      <SpotLabel label={label} />
      <Box sx={{ position: "relative" }}>
        <Paper
          variant="outlined"
          sx={{
            height: 110,
            p: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 0.5,
          }}
        >
          <Image
            src={landItemIconUrl(item.stakeTypeUid, item.name)}
            alt={item.name}
            width={48}
            height={48}
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            noWrap
            sx={{ lineHeight: 1.1, maxWidth: "100%" }}
          >
            {item.name}
          </Typography>
          {item.boost > 0 && (
            <Typography variant="caption" color="success.main">
              +{Math.round(item.boost * 100)}%
            </Typography>
          )}
        </Paper>
        <ClearButton onClear={onClear} disabled={disabled} />
      </Box>
    </Box>
  );
}
