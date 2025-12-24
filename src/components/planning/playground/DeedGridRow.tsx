"use client";

import {
  land_default_element_icon_url_placeholder,
  land_default_off_icon_url_placeholder,
  land_mythic_icon_url,
  land_under_construction_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { SlotInput } from "@/types/planner";
import {
  CardBloodline,
  cardIconMap,
  RuniTier,
  TERRAIN_BONUS,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "@/types/planner/primitives";
import { DeedChange, PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, MenuItem, Select, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import { useMemo, useState } from "react";
import DeedOutputDisplay from "./DeedOutputDisplay";
import { RuniIconSelector } from "./RuniIconSelector";
import { TitleIconSelector } from "./TitleIconSelector";
import { TotemIconSelector } from "./TotemIconSelector";
import { WorksiteIconSelector } from "./WorksiteIconSelector";

type Props = {
  deed: PlaygroundDeed;
  availableCards: PlaygroundCard[];
  allCards: PlaygroundCard[];
  cardDetails: SplCardDetails[];
  onChange: (change: DeedChange) => void;
  girdColumnsSizes: string;
};

// Status icon mapping
const statusIconMap: Record<string, string> = {
  natural: land_default_off_icon_url_placeholder.replace("__NAME__", "natural"),
  magical: land_default_off_icon_url_placeholder.replace("__NAME__", "magical"),
  construction: land_under_construction_icon_url,
};

export default function DeedGridRow({
  deed,
  availableCards,
  allCards,
  cardDetails,
  onChange,
  girdColumnsSizes,
}: Props) {
  const [selectedWorksite, setSelectedWorksite] = useState(
    deed.worksiteType || ""
  );
  const [selectedRuni, setSelectedRuni] = useState(deed.runi || "none");
  const [selectedTitle, setSelectedTitle] = useState(deed.titleTier);
  const [selectedTotem, setSelectedTotem] = useState(deed.totemTier);
  const [selectedWorkers, setSelectedWorkers] = useState<(string | null)[]>([
    deed.worker1Uid?.uid ?? null,
    deed.worker2Uid?.uid ?? null,
    deed.worker3Uid?.uid ?? null,
    deed.worker4Uid?.uid ?? null,
    deed.worker5Uid?.uid ?? null,
  ]);

  const handleWorksiteChange = (newWorksite: string) => {
    setSelectedWorksite(newWorksite);
    onChange({
      deed_uid: deed.deed_uid,
      field: "worksite",
      oldValue: deed.worksiteType,
      newValue: newWorksite,
      timestamp: new Date(),
    });
  };

  const handleRuniChange = (newRuni: RuniTier | null) => {
    setSelectedRuni(newRuni || "none");
    onChange({
      deed_uid: deed.deed_uid,
      field: "runi",
      oldValue: deed.runi,
      newValue: newRuni,
      timestamp: new Date(),
    });
  };

  const handleTitleChange = (newTitle: TitleTier | null) => {
    setSelectedTitle(newTitle || "none");
    onChange({
      deed_uid: deed.deed_uid,
      field: "title",
      oldValue: deed.titleTier,
      newValue: newTitle,
      timestamp: new Date(),
    });
  };

  const handleTotemChange = (newTotem: TotemTier | null) => {
    setSelectedTotem(newTotem || "none");
    onChange({
      deed_uid: deed.deed_uid,
      field: "totem",
      oldValue: deed.totemTier,
      newValue: newTotem,
      timestamp: new Date(),
    });
  };

  const handleWorkerChange = (slotIndex: number, cardUid: string) => {
    const newWorkers = [...selectedWorkers];
    newWorkers[slotIndex] = cardUid || null;
    setSelectedWorkers(newWorkers);

    // Create SlotInput for the change
    let newSlotInput: SlotInput | null = null;
    if (cardUid) {
      // Check if this is from original deed data
      const originalWorkers = [
        deed.worker1Uid,
        deed.worker2Uid,
        deed.worker3Uid,
        deed.worker4Uid,
        deed.worker5Uid,
      ];
      const originalSlot = originalWorkers.find(
        (slot) => slot?.uid === cardUid
      );

      if (originalSlot) {
        newSlotInput = originalSlot;
      } else {
        // Create new SlotInput from card data
        const card = allCards.find((c) => c.uid === cardUid);
        if (card) {
          const splCard = cardDetails.find(
            (cd) => cd.id === card.card_detail_id
          );
          newSlotInput = {
            id: 0,
            set: card.set,
            rarity: card.rarity,
            bcx: card.bcx,
            foil: card.foil,
            element: card.element,
            bloodline: (splCard?.sub_type ?? "Unknown") as CardBloodline,
            uid: card.uid,
          };
        }
      }
    }

    const workerField = `worker${slotIndex + 1}` as
      | "worker1"
      | "worker2"
      | "worker3"
      | "worker4"
      | "worker5";
    onChange({
      deed_uid: deed.deed_uid,
      field: workerField,
      oldValue: selectedWorkers[slotIndex],
      newValue: newSlotInput,
      timestamp: new Date(),
    });
  };

  // Create SlotInput array for selected workers
  const selectedWorkerSlots = useMemo(() => {
    return selectedWorkers.map((uid) => {
      if (!uid) return null;

      // Check if this is from original deed data
      const originalWorkers = [
        deed.worker1Uid,
        deed.worker2Uid,
        deed.worker3Uid,
        deed.worker4Uid,
        deed.worker5Uid,
      ];

      // Find in original slots first
      const originalSlot = originalWorkers.find((slot) => slot?.uid === uid);
      if (originalSlot) return originalSlot;

      // Otherwise, create new SlotInput from card data
      const card = allCards.find((c) => c.uid === uid);
      if (!card) return null;

      const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);

      return {
        id: 0,
        set: card.set,
        rarity: card.rarity,
        bcx: card.bcx,
        foil: card.foil,
        element: card.element,
        bloodline: (splCard?.sub_type ?? "Unknown") as CardBloodline,
        uid: card.uid,
      };
    });
  }, [selectedWorkers, deed, allCards, cardDetails]);

  const getRarityIcon = (rarity: string | null) => {
    if (!rarity) return null;
    const icon =
      rarity === "mythic"
        ? land_mythic_icon_url
        : land_default_off_icon_url_placeholder.replace(
            "__NAME__",
            rarity.toLowerCase()
          );
    return (
      <Image
        src={icon}
        alt={rarity}
        width={24}
        height={24}
        style={{ objectFit: "contain" }}
      />
    );
  };

  const getGeographyIcon = (deedType: string | null) => {
    if (!deedType) return "-";
    const icon = land_default_off_icon_url_placeholder.replace(
      "__NAME__",
      deedType.toLowerCase()
    );
    if (!icon) return deedType;
    return (
      <Tooltip title={deedType}>
        <Image
          src={icon}
          alt={deedType}
          width={24}
          height={24}
          style={{ objectFit: "contain" }}
        />
      </Tooltip>
    );
  };

  const getStatusIcon = (plotStatus: string | null) => {
    if (!plotStatus) return "-";
    const icon = statusIconMap[plotStatus.toLowerCase()];
    if (!icon) return plotStatus;
    return (
      <Tooltip title={plotStatus}>
        <Image
          src={icon}
          alt={plotStatus}
          width={24}
          height={24}
          style={{ objectFit: "contain" }}
        />
      </Tooltip>
    );
  };

  const getTerrainBoosts = () => {
    const deedType = deed.deedType?.toLowerCase() as keyof typeof TERRAIN_BONUS;
    if (!deedType || !TERRAIN_BONUS[deedType])
      return <Typography variant="body2">-</Typography>;

    const boosts = TERRAIN_BONUS[deedType];
    return (
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {Object.entries(boosts).map(([element, boost]) => {
          if (boost === undefined) return null;
          const icon = land_default_element_icon_url_placeholder.replace(
            "__NAME__",
            element.toLowerCase()
          );
          if (!icon || boost > 0) return null;
          const percentage = `+${(boost * 100).toFixed(0)}%`;
          return (
            <Tooltip key={element} title={`${element}: ${percentage}`}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                <Image
                  src={icon}
                  alt={element}
                  width={16}
                  height={16}
                  style={{ objectFit: "contain" }}
                />
                <Typography variant="caption" fontSize="0.65rem">
                  {percentage}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

  const getElementIcon = (card: PlaygroundCard) => {
    const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);
    const color = splCard?.color?.toLowerCase() ?? "red";
    const elementMap: Record<string, string> = {
      red: "fire",
      blue: "water",
      white: "life",
      black: "death",
      green: "earth",
      gold: "dragon",
      gray: "neutral",
    };
    const element = elementMap[color] || "fire";
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

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: girdColumnsSizes,
        p: 1,
        borderBottom: 1,
        borderColor: "divider",
        alignItems: "center",
        fontSize: "0.8rem",
        "&:hover": {
          bgcolor: "action.hover",
        },
      }}
    >
      {/* Tract/Region/Plot */}
      <Typography variant="body2" fontSize="0.75rem">
        R{deed.region_number} T{deed.tract_number} P{deed.plot_number}
      </Typography>

      {/* Rarity */}
      <Box>{getRarityIcon(deed.rarity)}</Box>

      {/* Geography (deedType) */}
      <Box>{getGeographyIcon(deed.deedType)}</Box>

      {/* Status */}
      <Box>{getStatusIcon(deed.plotStatus)}</Box>

      {/* Terrain Boosts */}
      <Box>{getTerrainBoosts()}</Box>

      {/* Worksite */}
      <Box>
        <WorksiteIconSelector
          value={selectedWorksite as WorksiteType}
          deedType={deed.deedType ?? "natural"}
          plotStatus={deed.plotStatus ?? "fire"}
          onChange={handleWorksiteChange}
        />
      </Box>

      {/* Runi */}
      <Box>
        <RuniIconSelector value={selectedRuni} onChange={handleRuniChange} />
      </Box>

      {/* Title */}
      <Box>
        <TitleIconSelector value={selectedTitle} onChange={handleTitleChange} />
      </Box>

      {/* Totem */}
      <Box>
        <TotemIconSelector value={selectedTotem} onChange={handleTotemChange} />
      </Box>

      {/* Workers 1-5 */}
      {[0, 1, 2, 3, 4].map((slotIndex) => {
        const workerUid = selectedWorkers[slotIndex];
        // Find current card in ALL cards (including staked)
        const currentCard = workerUid
          ? allCards.find((c) => c.uid === workerUid)
          : null;

        // Get cards assigned to OTHER worker slots in this deed
        const otherWorkerUids = selectedWorkers.filter(
          (uid, idx) => idx !== slotIndex && uid !== null
        );

        // Build options: current card (if exists) + available cards not in other slots
        const filteredAvailable = availableCards.filter(
          (c) => !otherWorkerUids.includes(c.uid)
        );

        const options = currentCard
          ? [currentCard, ...filteredAvailable.slice(0, 20)]
          : filteredAvailable.slice(0, 20);

        return (
          <Select
            key={`${deed.deed_uid}-worker${slotIndex}`}
            size="small"
            value={workerUid || ""}
            onChange={(e) => handleWorkerChange(slotIndex, e.target.value)}
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
                    style={{ objectFit: "contain" }}
                  />
                  <Image
                    src={rarityIcon}
                    alt="rarity"
                    width={14}
                    height={14}
                    style={{ objectFit: "contain" }}
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
            sx={{ fontSize: "0.75rem" }}
          >
            <MenuItem value="">
              <em>Empty</em>
            </MenuItem>
            {options.map((card) => {
              const elementIcon = getElementIcon(card);
              const rarityIcon = getRarityIconForCard(card);

              return (
                <MenuItem key={`${slotIndex}-${card.uid}`} value={card.uid}>
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
                      style={{ objectFit: "contain" }}
                    />
                    {/* Rarity Icon */}
                    <Image
                      src={rarityIcon}
                      alt="rarity"
                      width={16}
                      height={16}
                      style={{ objectFit: "contain" }}
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
      })}

      {/* Output */}
      <DeedOutputDisplay
        deed={deed}
        selectedWorksite={selectedWorksite}
        selectedRuni={selectedRuni}
        selectedTitle={selectedTitle}
        selectedTotem={selectedTotem}
        selectedWorkers={selectedWorkerSlots}
      />
    </Box>
  );
}
