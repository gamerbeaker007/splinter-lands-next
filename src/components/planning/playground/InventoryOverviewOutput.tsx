import { runiIconMap, titleIconMap, totemIconMap } from "@/lib/shared/statics";
import {
  RuniTier,
  titleModifiers,
  TitleTier,
  TotemTier,
} from "@/types/planner";
import { PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import { SplInventory } from "@/types/spl/inventory";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

type InventoryOverviewOutputProps = {
  deeds: PlaygroundDeed[];
  inventory: SplInventory[];
  loadingInventory: boolean;
  allCards: PlaygroundCard[];
};

export default function InventoryOverviewOutput({
  deeds,
  inventory,
  loadingInventory,
  allCards,
}: InventoryOverviewOutputProps) {
  const totalDeeds = deeds.length;

  // Count totems by rarity
  const totemCounts = {
    common: { owned: 0, selected: 0 },
    rare: { owned: 0, selected: 0 },
    epic: { owned: 0, selected: 0 },
    legendary: { owned: 0, selected: 0 },
  };

  inventory.forEach((item) => {
    if (item.sub_type === "Totem") {
      const rarity = item.name
        .toLowerCase()
        .split(" ")[0] as keyof typeof totemCounts;

      if (totemCounts[rarity]) {
        totemCounts[rarity].owned += item.quantity;
      }
    }
  });

  deeds.forEach((deed) => {
    if (deed.totemTier && deed.totemTier !== "none") {
      const rarity = deed.totemTier as keyof typeof totemCounts;
      if (totemCounts[rarity]) {
        totemCounts[rarity].selected++;
      }
    }
  });

  // Count titles by rarity (boost determines rarity)
  const titleCounts = {
    rare: { owned: 0, selected: 0 },
    epic: { owned: 0, selected: 0 },
    legendary: { owned: 0, selected: 0 },
  };

  inventory.forEach((item) => {
    if (item.type === "Title") {
      const boost = parseFloat(item.boost || "0");

      // Find rarity by matching boost value in titleModifiers
      let rarity: keyof typeof titleCounts | null = null;
      for (const [tier, tierBoost] of Object.entries(titleModifiers)) {
        if (tier !== "none" && boost === tierBoost) {
          rarity = tier as keyof typeof titleCounts;
          break;
        }
      }

      if (rarity && titleCounts[rarity]) {
        titleCounts[rarity].owned += item.quantity;
      }
    }
  });

  deeds.forEach((deed) => {
    if (deed.titleTier && deed.titleTier !== "none") {
      const rarity = deed.titleTier as keyof typeof titleCounts;
      if (titleCounts[rarity]) {
        titleCounts[rarity].selected++;
      }
    }
  });

  // Count runi by foil type
  const runiCounts = {
    regular: { owned: 0, selected: 0 },
    gold: { owned: 0, selected: 0 },
  };

  allCards.forEach((card) => {
    if (card.name.toLowerCase() === "runi") {
      if (runiCounts[card.foil as keyof typeof runiCounts]) {
        runiCounts[card.foil as keyof typeof runiCounts].owned++;
      }
    }
  });

  deeds.forEach((deed) => {
    if (deed.runi && deed.runi !== "none") {
      if (runiCounts[deed.runi as keyof typeof runiCounts]) {
        runiCounts[deed.runi as keyof typeof runiCounts].selected++;
      }
    }
  });

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h5" gutterBottom>
        Overview
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 2,
          mt: 2,
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            Total Deeds
          </Typography>
          <Typography variant="h6">{totalDeeds}</Typography>
        </Box>
      </Box>

      {/* Inventory Stats */}
      {!loadingInventory && inventory.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Inventory Usage (Selected / Owned)
          </Typography>
          <Box
            display={"flex"}
            flexDirection={"row"}
            flexWrap={"wrap"}
            gap={10}
          >
            {/* Totems */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Totems
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                {Object.entries(totemCounts).map(([rarity, counts]) => {
                  const iconUrl = totemIconMap[rarity as TotemTier];
                  return (
                    <Tooltip key={rarity} title={`${rarity} totem`}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Image
                          src={iconUrl}
                          alt={rarity}
                          width={32}
                          height={32}
                          style={{ objectFit: "contain" }}
                        />
                        <Typography
                          variant="caption"
                          color={
                            counts.selected > counts.owned
                              ? "error.main"
                              : "text.primary"
                          }
                        >
                          {counts.selected} / {counts.owned}
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>

            {/* Titles */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Titles
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                {Object.entries(titleCounts).map(([rarity, counts]) => {
                  const iconUrl = titleIconMap[rarity as TitleTier];
                  return (
                    <Tooltip key={rarity} title={`${rarity} title`}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Image
                          src={iconUrl}
                          alt={rarity}
                          width={32}
                          height={32}
                          style={{ objectFit: "contain" }}
                        />
                        <Typography
                          variant="caption"
                          color={
                            counts.selected > counts.owned
                              ? "error.main"
                              : "text.primary"
                          }
                        >
                          {counts.selected} / {counts.owned}
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>

            {/* Runi */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Runi Cards
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                {Object.entries(runiCounts).map(([foil, counts]) => {
                  const iconUrl = runiIconMap[foil as RuniTier];
                  return (
                    <Box
                      key={foil}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Image
                        src={iconUrl}
                        alt={foil}
                        width={32}
                        height={32}
                        style={{ objectFit: "contain" }}
                      />
                      <Typography
                        variant="caption"
                        color={
                          counts.selected > counts.owned
                            ? "error.main"
                            : "text.primary"
                        }
                      >
                        {counts.selected} / {counts.owned}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
