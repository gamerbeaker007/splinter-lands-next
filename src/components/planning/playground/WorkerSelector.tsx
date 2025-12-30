"use client";

import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import {
  CardFoil,
  cardIconMap,
  cardSetIconMap,
} from "@/types/planner/primitives";
import { PlaygroundCard } from "@/types/playground";
import { Box, MenuItem, Select, Typography } from "@mui/material";
import Image from "next/image";
import { TbCardsFilled } from "react-icons/tb";
import { COLUMN_WIDTHS } from "./gridConstants";

type Props = {
  slotIndex: number;
  deedUid: string;
  workerUid: string | null;
  availableCards: PlaygroundCard[];
  allCards: PlaygroundCard[];
  selectedWorkerUids: (string | null)[];
  onChange: (slotIndex: number, cardUid: string) => void;
};

export default function WorkerSelector({
  slotIndex,
  deedUid,
  workerUid,
  availableCards,
  allCards,
  selectedWorkerUids,
  onChange,
}: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

  const getElementIcon = (card: PlaygroundCard) => {
    return land_default_element_icon_url_placeholder.replace(
      "__NAME__",
      card.element.toLowerCase()
    );
  };

  const renderFoilIcon = (foil: CardFoil, size = 14) => {
    const foilStyle: Record<
      CardFoil,
      { iconColor: string; badgeText?: string; badgeColor?: string }
    > = {
      regular: { iconColor: "gray" },
      gold: { iconColor: "gold" },
      "gold arcane": {
        iconColor: "gold",
        badgeText: "GV",
        badgeColor: "black",
      },
      black: { iconColor: "black" },
      "black arcane": {
        iconColor: "black",
        badgeText: "BV",
        badgeColor: "white",
      },
    };

    const { iconColor, badgeText, badgeColor } =
      foilStyle[foil] ?? foilStyle.regular;
    const badgeFont = Math.max(6, Math.floor(size * 0.5));

    return (
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          display: "inline-block",
          lineHeight: 0,
        }}
      >
        <TbCardsFilled
          size={size}
          color={iconColor}
          style={{ display: "block" }}
        />
        {badgeText && (
          <Typography
            component="span"
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              fontSize: badgeFont,
              fontWeight: 900,
              color: badgeColor,
              letterSpacing: 0.3,
              userSelect: "none",
              textShadow:
                badgeColor === "black"
                  ? "0 0 1px rgba(255,255,255,0.9)"
                  : "0 0 1px rgba(0,0,0,0.8)",
            }}
          >
            {badgeText}
          </Typography>
        )}
      </Box>
    );
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
    <Box width={COLUMN_WIDTHS.LARGE} flexShrink={0} mr={1} ml={1}>
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
          const rarityIcon = cardIconMap[card.rarity] || cardIconMap["common"];
          const setIcon = cardSetIconMap[card.set] || cardIconMap["chaos"];

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
              <Box sx={{ width: 25, height: 25 }}>
                <Image
                  src={setIcon}
                  alt="set"
                  width={14}
                  height={14}
                  style={{
                    objectFit: "contain",
                    width: "auto",
                    height: "auto",
                  }}
                />
              </Box>
              {renderFoilIcon(card.foil, 20)}
              <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                {card.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({fmt(card.landBasePP)})
              </Typography>
            </Box>
          );
        }}
        sx={{ width: "100%", fontSize: "0.75rem" }}
      >
        <MenuItem value="">
          <em>Empty</em>
        </MenuItem>
        {options.map((card) => {
          const elementIcon = getElementIcon(card);
          const rarityIcon = cardIconMap[card.rarity] || cardIconMap["common"];
          const setIcon = cardSetIconMap[card.set] || cardIconMap["chaos"];

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
                  style={{
                    objectFit: "contain",
                    width: "auto",
                    height: "auto",
                  }}
                />
                {/* Rarity Icon */}
                <Image
                  src={rarityIcon}
                  alt="rarity"
                  width={16}
                  height={16}
                  style={{
                    objectFit: "contain",
                    width: "auto",
                    height: "auto",
                  }}
                />
                {/* Set Icon */}
                <Box sx={{ width: 25, height: 25 }}>
                  <Image
                    src={setIcon}
                    alt="set"
                    width={16}
                    height={16}
                    style={{
                      objectFit: "contain",
                      width: "auto",
                      height: "auto",
                    }}
                  />
                </Box>
                {/* Foil Icon */}
                {renderFoilIcon(card.foil, 20)}
                {/* Name and PP */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" display="block">
                    {card.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fmt(card.landBasePP)} PP
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </Box>
  );
}
