"use client";

import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { cardElementColorMap, cardIconMap } from "@/types/planner/primitives";
import { PlaygroundCard } from "@/types/playground";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, MenuItem, Select, Typography } from "@mui/material";
import Image from "next/image";

type Props = {
  slotIndex: number;
  deedUid: string;
  workerUid: string | null;
  availableCards: PlaygroundCard[];
  allCards: PlaygroundCard[];
  cardDetails: SplCardDetails[];
  selectedWorkerUids: (string | null)[];
  onChange: (slotIndex: number, cardUid: string) => void;
};

export default function WorkerSelector({
  slotIndex,
  deedUid,
  workerUid,
  availableCards,
  allCards,
  cardDetails,
  selectedWorkerUids,
  onChange,
}: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

  const getElementIcon = (card: PlaygroundCard) => {
    const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);
    const color = splCard?.color?.toLowerCase() ?? "red";
    const element = cardElementColorMap[color] || "fire";
    return land_default_element_icon_url_placeholder.replace(
      "__NAME__",
      element.toLowerCase()
    );
  };

  const getRarityIconForCard = (card: PlaygroundCard) => {
    const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);
    const rarityIndex = (splCard?.rarity ?? 1) - 1;
    const rarities = ["common", "rare", "epic", "legendary"];
    const rarity = rarities[rarityIndex] || "common";
    return cardIconMap[rarity as keyof typeof cardIconMap];
  };

  // Find current card in ALL cards (including staked)
  const currentCard = workerUid
    ? allCards.find((c) => c.uid === workerUid)
    : null;

  // Get cards assigned to OTHER worker slots in this deed
  const otherWorkerUids = selectedWorkerUids.filter(
    (uid, idx) => idx !== slotIndex && uid !== null
  );

  // Build options: current card (if exists) + available cards not in other slots
  const filteredAvailable = availableCards.filter(
    (c) => !otherWorkerUids.includes(c.uid)
  );

  // Deduplicate: if current card is in filteredAvailable, don't add it twice
  const options = currentCard
    ? [
        currentCard,
        ...filteredAvailable
          .filter((c) => c.uid !== currentCard.uid)
          .slice(0, 20),
      ]
    : filteredAvailable.slice(0, 20);

  return (
    <Select
      size="small"
      value={workerUid || ""}
      onChange={(e) => onChange(slotIndex, e.target.value)}
      displayEmpty
      renderValue={(value) => {
        if (!value) return <em>Empty</em>;
        const card = allCards.find((c) => c.uid === value);
        if (!card) return <em>Empty</em>;

        // Show same format as dropdown: element icon, rarity icon, name, PP
        const elementIcon = getElementIcon(card);
        const rarityIcon = getRarityIconForCard(card);

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Image
              src={elementIcon}
              alt="element"
              width={14}
              height={14}
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
            />
            <Image
              src={rarityIcon}
              alt="rarity"
              width={14}
              height={14}
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
            />
            <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
              {card.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({fmt(card.land_base_pp)})
            </Typography>
          </Box>
        );
      }}
      sx={{ fontSize: "0.75rem", ml: 0.5, mr: 0.5 }}
    >
      <MenuItem value="">
        <em>Empty</em>
      </MenuItem>
      {options.map((card) => {
        const elementIcon = getElementIcon(card);
        const rarityIcon = getRarityIconForCard(card);

        return (
          <MenuItem
            key={`${deedUid}-slot${slotIndex}-${card.uid}`}
            value={card.uid}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: "100%",
              }}
            >
              {/* Element Icon */}
              <Image
                src={elementIcon}
                alt="element"
                width={16}
                height={16}
                style={{ objectFit: "contain", width: "auto", height: "auto" }}
              />
              {/* Rarity Icon */}
              <Image
                src={rarityIcon}
                alt="rarity"
                width={16}
                height={16}
                style={{ objectFit: "contain", width: "auto", height: "auto" }}
              />
              {/* Name and PP */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" display="block">
                  {card.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fmt(card.land_base_pp)} PP
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        );
      })}
    </Select>
  );
}
