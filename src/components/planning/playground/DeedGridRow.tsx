"use client";

import { SlotInput } from "@/types/planner";
import {
  CardBloodline,
  RuniTier,
  TitleTier,
  TotemTier,
  WorksiteType,
} from "@/types/planner/primitives";
import { DeedChange, PlaygroundCard, PlaygroundDeed } from "@/types/playground";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import GeographyColumn from "./columns/GeographyColumn";
import LinkColumn from "./columns/LinkColumn";
import RarityColumn from "./columns/RarityColumn";
import StatusColumn from "./columns/StatusColumn";
import TerrainBoostsColumn from "./columns/TerrainBoostsColumn";
import TractRegionPlotColumn from "./columns/TractRegionPlotColumn";
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
};

// Helper to extract worker UIDs from deed
const getWorkerUids = (deed: PlaygroundDeed): (string | null)[] => [
  deed.worker1Uid?.uid ?? null,
  deed.worker2Uid?.uid ?? null,
  deed.worker3Uid?.uid ?? null,
  deed.worker4Uid?.uid ?? null,
  deed.worker5Uid?.uid ?? null,
];

export default function DeedGridRow({
  deed,
  availableCards,
  allCards,
  cardDetails,
  onChange,
}: Props) {
  const [selectedWorksite, setSelectedWorksite] = useState(
    deed.worksiteType || ""
  );
  const [selectedRuni, setSelectedRuni] = useState(deed.runi || "none");
  const [selectedTitle, setSelectedTitle] = useState(deed.titleTier);
  const [selectedTotem, setSelectedTotem] = useState(deed.totemTier);
  const [selectedWorkers, setSelectedWorkers] = useState<(string | null)[]>(
    () => getWorkerUids(deed)
  );

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

  // Helper to create SlotInput from card UID
  const createSlotInput = (cardUid: string | null): SlotInput | null => {
    if (!cardUid) return null;

    const originalWorkers = [
      deed.worker1Uid,
      deed.worker2Uid,
      deed.worker3Uid,
      deed.worker4Uid,
      deed.worker5Uid,
    ];
    const originalSlot = originalWorkers.find((slot) => slot?.uid === cardUid);
    if (originalSlot) return originalSlot;

    const card = allCards.find((c) => c.uid === cardUid);
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
  };

  const handleWorkerChange = (slotIndex: number, cardUid: string) => {
    const oldWorkerUid = selectedWorkers[slotIndex];
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
      oldValue: oldWorkerUid,
      newValue: createSlotInput(cardUid),
      timestamp: new Date(),
    });
  };

  // Create SlotInput array for selected workers
  const selectedWorkerSlots = useMemo(
    () => selectedWorkers.map(createSlotInput),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedWorkers, allCards, cardDetails]
  );

  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={rowRef}
      sx={{
        display: "flex",
        borderBottom: 1,
        p: 1,
        borderColor: "divider",
        alignItems: "center",
        fontSize: "0.8rem",
        "&:hover": {
          bgcolor: "action.hover",
        },
      }}
    >
      {/* Tract/Region/Plot */}
      <TractRegionPlotColumn
        regionNumber={deed.region_number}
        tractNumber={deed.tract_number}
        plotNumber={deed.plot_number}
      />

      {/* Link */}
      <LinkColumn regionNumber={deed.region_number} plotId={deed.plot_id} />

      {/* Rarity */}
      <RarityColumn rarity={deed.rarity} />

      {/* Geography (deedType) */}
      <GeographyColumn deedType={deed.deedType} />

      {/* Status */}
      <StatusColumn plotStatus={deed.plotStatus} />

      {/* Terrain Boosts */}
      <TerrainBoostsColumn deedType={deed.deedType} />

      {/* Worksite */}
      <WorksiteIconSelector
        value={selectedWorksite as WorksiteType}
        deedType={deed.deedType ?? "natural"}
        plotStatus={deed.plotStatus ?? "fire"}
        onChange={handleWorksiteChange}
      />

      {/* Runi */}
      <RuniIconSelector value={selectedRuni} onChange={handleRuniChange} />

      {/* Title */}
      <TitleIconSelector value={selectedTitle} onChange={handleTitleChange} />

      {/* Totem */}
      <TotemIconSelector value={selectedTotem} onChange={handleTotemChange} />

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
