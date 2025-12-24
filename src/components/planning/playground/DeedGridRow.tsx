"use client";

import {
  land_default_element_icon_url_placeholder,
  land_default_off_icon_url_placeholder,
  land_mythic_icon_url,
  land_under_construction_icon_url,
} from "@/lib/shared/statics_icon_urls";
import {
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
  cardDetails: SplCardDetails[]; // Currently unused but kept for future enhancements
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
    deed.worker1Uid,
    deed.worker2Uid,
    deed.worker3Uid,
    deed.worker4Uid,
    deed.worker5Uid,
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
      newValue: cardUid || null,
      timestamp: new Date(),
    });
  };

  // Calculate boosted PP dynamically based on selected cards
  const boostedPP = useMemo(() => {
    const workerCards = selectedWorkers
      .filter((uid) => uid !== null)
      .map((uid) => allCards.find((c) => c.uid === uid))
      .filter((card): card is PlaygroundCard => card !== undefined);

    const cardInputs = workerCards.map((card) => ({
      uid: card.uid,
      card_detail_id: card.card_detail_id,
      bcx: card.bcx,
      level: card.level,
      foil: card.foil,
      landBasePP: card.land_base_pp,
    }));

    // Sum base PP from workers
    const workerPP = cardInputs.reduce((sum, c) => sum + c.landBasePP, 0);

    // Calculate total boosted PP (simplified version)
    // This is a simplified calculation - for full accuracy, would need to use computeSlot per card
    return deed.basePP + workerPP;
  }, [deed.basePP, selectedWorkers, allCards]);

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
            key={slotIndex}
            size="small"
            value={workerUid || ""}
            onChange={(e) => handleWorkerChange(slotIndex, e.target.value)}
            displayEmpty
            sx={{ fontSize: "0.75rem" }}
          >
            <MenuItem value="">
              <em>Empty</em>
            </MenuItem>
            {options.map((card) => (
              <MenuItem key={card.uid} value={card.uid}>
                <Box>
                  <Typography variant="caption">{card.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {" "}
                    ({fmt(card.land_base_pp)} PP)
                  </Typography>
                </Box>
              </MenuItem>
            ))}
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
        selectedWorkers={selectedWorkers}
        boostedPP={boostedPP}
      />
    </Box>
  );
}
