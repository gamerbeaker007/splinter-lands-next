"use client";

import { Resource } from "@/constants/resource/resource";
import { getPlayerInventory } from "@/lib/backend/actions/player/inventory-actions";
import {
  PRODUCING_RESOURCES,
  RESOURCE_ICON_MAP,
  runiIconMap,
  titleIconMap,
  totemIconMap,
} from "@/lib/shared/statics";
import {
  RuniTier,
  titleModifiers,
  TitleTier,
  TotemTier,
} from "@/types/planner";
import { PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import { PlaygroundSummary } from "@/types/playgroundOutput";
import { SplInventory } from "@/types/spl/inventory";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";

type PlaygroundOverviewProps = {
  deeds: PlaygroundDeed[];
  originalOutputs: PlaygroundSummary;
  updatedOutputs: PlaygroundSummary;
  playerName: string | null;
  allCards: PlaygroundCard[];
};

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

const netColor = (v: number) =>
  v > 0 ? "success.main" : v < 0 ? "error.main" : "text.primary";

export default function PlaygroundOverview({
  deeds,
  originalOutputs,
  updatedOutputs,
  playerName,
  allCards,
}: PlaygroundOverviewProps) {
  const [inventory, setInventory] = useState<SplInventory[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    if (!playerName) {
      setInventory([]);
      return;
    }

    const fetchInventory = async () => {
      setLoadingInventory(true);
      try {
        const data = await getPlayerInventory(playerName);
        setInventory(data);
      } catch (err) {
        console.error("Failed to load inventory:", err);
        setInventory([]);
      } finally {
        setLoadingInventory(false);
      }
    };
    fetchInventory();
  }, [playerName]);

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
      console.log("Found runi card in inventory:", card.uid, card.foil, card);
      if (runiCounts[card.foil as keyof typeof runiCounts]) {
        runiCounts[card.foil as keyof typeof runiCounts].owned++;
      }
    }
  });

  deeds.forEach((deed) => {
    if (deed.runi && deed.runi !== "none") {
      if (runiCounts[deed.runi as keyof typeof runiCounts]) {
        console.log(
          "Incrementing runi count for",
          deed.runi,
          "deed:",
          deed.deed_uid
        );
        runiCounts[deed.runi as keyof typeof runiCounts].selected++;
      }
    }
  });

  const minColumnWidth = 80;
  const gridTemplate = `140px repeat(${PRODUCING_RESOURCES.length}, minmax(${minColumnWidth}px, 1fr))`;

  return (
    <Box sx={{ mb: 2 }}>
      {/* Basic Stats */}
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

      {/* Original Output Table */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Original Output
        </Typography>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflowX: "auto",
            mt: 2,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              bgcolor: "action.hover",
              px: 1,
              py: 0.75,
              borderBottom: "1px solid",
              borderColor: "divider",
              gap: 1,
            }}
          >
            <Typography fontWeight={600}>Metric</Typography>
            {PRODUCING_RESOURCES.map((res) => (
              <Box
                key={res}
                display="flex"
                justifyContent="left"
                alignItems="center"
              >
                <Image
                  src={RESOURCE_ICON_MAP[res]}
                  alt={res}
                  width={25}
                  height={25}
                  style={{ display: "block" }}
                />
              </Box>
            ))}
          </Box>

          {/* Rows */}
          {[
            { label: "PP", key: "pp" as const },
            { label: "Produced", key: "produced" as const },
            { label: "Consumed", key: "consumed" as const },
            { label: "Net (P − C)", key: "net" as const },
          ].map(({ label, key }) => (
            <Box
              key={label}
              sx={{
                display: "grid",
                gridTemplateColumns: gridTemplate,
                px: 1,
                py: 0.75,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-of-type": { borderBottom: "none" },
                gap: 1,
              }}
            >
              <Typography fontWeight={key === "net" ? 700 : 500}>
                {label}
              </Typography>

              {PRODUCING_RESOURCES.map((res) => {
                const data = originalOutputs.perResource[res as Resource] || {
                  pp: 0,
                  produced: 0,
                  consumed: 0,
                  net: 0,
                };
                const value =
                  key === "pp"
                    ? data.pp
                    : key === "produced"
                      ? data.produced
                      : key === "consumed"
                        ? data.consumed
                        : data.net;
                return (
                  <Box
                    key={res}
                    sx={
                      key === "net"
                        ? {
                            color: netColor(value),
                            fontWeight: 700,
                            textAlign: "left",
                          }
                        : { textAlign: "left" }
                    }
                  >
                    {fmt(value)}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">
            Total Base PP: {fmt(originalOutputs.totalBasePP)}
          </Typography>
          <Typography variant="body2">
            | Total Boosted PP: {fmt(originalOutputs.totalBoostedPP)}
          </Typography>
        </Box>
      </Paper>

      {/* Updated Output Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Updated Output (with changes)
        </Typography>
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflowX: "auto",
            mt: 2,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              bgcolor: "action.hover",
              px: 1,
              py: 0.75,
              borderBottom: "1px solid",
              borderColor: "divider",
              gap: 1,
            }}
          >
            <Typography fontWeight={600}>Metric</Typography>
            {PRODUCING_RESOURCES.map((res) => (
              <Box
                key={res}
                display="flex"
                justifyContent="left"
                alignItems="center"
              >
                <Image
                  src={RESOURCE_ICON_MAP[res]}
                  alt={res}
                  width={25}
                  height={25}
                  style={{ display: "block" }}
                />
              </Box>
            ))}
          </Box>

          {/* Rows */}
          {[
            { label: "PP", key: "pp" as const },
            { label: "Produced", key: "produced" as const },
            { label: "Consumed", key: "consumed" as const },
            { label: "Net (P − C)", key: "net" as const },
          ].map(({ label, key }) => (
            <Box
              key={label}
              sx={{
                display: "grid",
                gridTemplateColumns: gridTemplate,
                px: 1,
                py: 0.75,
                borderBottom: "1px solid",
                borderColor: "divider",
                "&:last-of-type": { borderBottom: "none" },
                gap: 1,
              }}
            >
              <Typography fontWeight={key === "net" ? 700 : 500}>
                {label}
              </Typography>

              {PRODUCING_RESOURCES.map((res) => {
                const data = updatedOutputs.perResource[res as Resource] || {
                  pp: 0,
                  produced: 0,
                  consumed: 0,
                  net: 0,
                };
                const value =
                  key === "pp"
                    ? data.pp
                    : key === "produced"
                      ? data.produced
                      : key === "consumed"
                        ? data.consumed
                        : data.net;
                return (
                  <Box
                    key={res}
                    sx={
                      key === "net"
                        ? {
                            color: netColor(value),
                            fontWeight: 700,
                            textAlign: "left",
                          }
                        : { textAlign: "left" }
                    }
                  >
                    {fmt(value)}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">
            Total Base PP: {fmt(updatedOutputs.totalBasePP)}
          </Typography>
          <Typography variant="body2">
            | Total Boosted PP: {fmt(updatedOutputs.totalBoostedPP)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
