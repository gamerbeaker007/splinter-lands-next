"use client";

import { ManageLink } from "@/components/player-overview/deed-overview/land-deed-card/link-components/ManageLink";
import {
  land_default_element_icon_url_placeholder,
  land_default_off_icon_url_placeholder,
  land_mythic_icon_url,
  land_under_construction_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { SlotInput } from "@/types/planner";
import {
  CardBloodline,
  RuniTier,
  TERRAIN_BONUS,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "@/types/planner/primitives";
import { DeedChange, PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import { useMemo, useState } from "react";
import DeedOutputDisplay from "./DeedOutputDisplay";
import { RuniIconSelector } from "./RuniIconSelector";
import { TitleIconSelector } from "./TitleIconSelector";
import { TotemIconSelector } from "./TotemIconSelector";
import WorkerSelector from "./WorkerSelector";
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
        style={{ objectFit: "contain", width: "auto", height: "auto" }}
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
          style={{ objectFit: "contain", width: "auto", height: "auto" }}
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
          style={{ objectFit: "contain", width: "auto", height: "auto" }}
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
                  style={{
                    objectFit: "contain",
                    width: "auto",
                    height: "auto",
                  }}
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

      <Box>
        <ManageLink regionNumber={deed.region_number} plotId={deed.plot_id} />
      </Box>

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
      {[0, 1, 2, 3, 4].map((slotIndex) => (
        <WorkerSelector
          key={`${deed.deed_uid}-worker${slotIndex}`}
          slotIndex={slotIndex}
          deedUid={deed.deed_uid}
          workerUid={selectedWorkers[slotIndex]}
          availableCards={availableCards}
          allCards={allCards}
          cardDetails={cardDetails}
          selectedWorkerUids={selectedWorkers}
          onChange={handleWorkerChange}
        />
      ))}

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
