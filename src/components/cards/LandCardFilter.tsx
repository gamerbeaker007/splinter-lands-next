"use client";

import FilterIcon from "@/components/filter/FilterIcon";
import LandEditionSetFilter from "@/components/cards/LandEditionSetFilter";
import FoilIcon from "@/components/ui/FoilIcon";
import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { CardFilterOptions } from "@/types/cardFilter";
import {
  CardElement,
  cardElementOptions,
  CardFoil,
  cardFoilOptions,
  cardIconMap,
  CardRarity,
  cardRarityOptions,
} from "@/types/planner";
import { PlayerLandCard } from "@/types/playground";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { isCooldownActive } from "@/lib/frontend/utils/landCardFilters";

type LandCardFilterProps = {
  cards: PlayerLandCard[];
  filteredCardCount?: number;
  assignedCardCount?: number;
  filterOptions: CardFilterOptions;
  onFilterChange: (newFilters: CardFilterOptions) => void;
};

const fontSizeSmall = "0.8rem";

/** A tri-state Yes / No / (off) toggle row used by the boolean card filters. */
function TriToggle({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
}>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography sx={{ fontSize: fontSizeSmall }}>{label}</Typography>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Button
          variant={value === true ? "contained" : "outlined"}
          color="success"
          size="small"
          sx={{ fontSize: fontSizeSmall, minWidth: 50, py: 0.2, px: 1 }}
          onClick={() => onChange(value === true ? undefined : true)}
        >
          Yes
        </Button>
        <Button
          variant={value === false ? "contained" : "outlined"}
          color="error"
          size="small"
          sx={{ fontSize: fontSizeSmall, minWidth: 50, py: 0.2, px: 1 }}
          onClick={() => onChange(value === false ? undefined : false)}
        >
          No
        </Button>
      </Box>
    </Box>
  );
}

export default function LandCardFilter({
  cards,
  filteredCardCount,
  assignedCardCount,
  filterOptions,
  onFilterChange,
}: Readonly<LandCardFilterProps>) {
  const availableStats = useMemo(() => {
    const onWagonCount = cards.filter((c) => c.onWagon).length;
    const inSetCount = cards.filter((c) => c.inSet).length;
    const isListedCount = cards.filter((c) => c.isListed).length;
    const ownedCount = cards.filter((c) => c.owned).length;
    const delegatedCount = cards.filter((c) => c.delegated).length;
    const onLandCooldown = cards.filter((c) =>
      isCooldownActive(c.landCooldownDate)
    ).length;
    const onSurvivalCoolDown = cards.filter((c) =>
      isCooldownActive(c.survivalDate)
    ).length;
    const maxPP = Math.max(...cards.map((c) => c.landBasePP), 0);

    return {
      onWagonCount,
      inSetCount,
      isListedCount,
      ownedCount,
      delegatedCount,
      onLandCooldown,
      onSurvivalCoolDown,
      maxPP,
    };
  }, [cards]);

  const handleRarityToggle = (rarity: CardRarity) => {
    const updated = filterOptions.rarities.includes(rarity)
      ? filterOptions.rarities.filter((r) => r !== rarity)
      : [...filterOptions.rarities, rarity];
    onFilterChange({ ...filterOptions, rarities: updated });
  };

  const handleElementToggle = (element: CardElement) => {
    const updated = filterOptions.elements.includes(element)
      ? filterOptions.elements.filter((e) => e !== element)
      : [...filterOptions.elements, element];
    onFilterChange({ ...filterOptions, elements: updated });
  };

  const handleFoilToggle = (foil: CardFoil) => {
    const updated = filterOptions.foils.includes(foil)
      ? filterOptions.foils.filter((f) => f !== foil)
      : [...filterOptions.foils, foil];
    onFilterChange({ ...filterOptions, foils: updated });
  };

  const handleMinPPChange = (value: number) => {
    onFilterChange({ ...filterOptions, minPP: Math.max(0, value) });
  };

  const getElementIcon = (element: string) => {
    return land_default_element_icon_url_placeholder.replace(
      "__NAME__",
      element.toLowerCase()
    );
  };

  const runiCount = cards.filter((card) => card.cardDetailId === 505).length;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Card Filters
      </Typography>
      <Stack>
        <Typography variant="caption" gutterBottom>
          Total Worker Cards: {cards.length}
        </Typography>
        <Typography variant="caption" gutterBottom>
          Runi(s): {runiCount}
        </Typography>
        <Typography variant="caption" gutterBottom>
          Assigned Cards: {assignedCardCount}
        </Typography>
        <Typography variant="caption" gutterBottom>
          Filtered Cards: {filteredCardCount}
        </Typography>
      </Stack>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Boolean Filters */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* On Wagon Filter */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={{ fontSize: fontSizeSmall }}>
              On Wagon ({availableStats.onWagonCount}):
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button
                variant={
                  filterOptions.onWagon === true ? "contained" : "outlined"
                }
                color="success"
                size="small"
                sx={{ fontSize: fontSizeSmall, minWidth: 50, py: 0.2, px: 1 }}
                onClick={() =>
                  onFilterChange({
                    ...filterOptions,
                    onWagon: filterOptions.onWagon === true ? undefined : true,
                  })
                }
              >
                Yes
              </Button>
              <Button
                variant={
                  filterOptions.onWagon === false ? "contained" : "outlined"
                }
                color="error"
                size="small"
                sx={{ fontSize: fontSizeSmall, minWidth: 50, py: 0.2, px: 1 }}
                onClick={() =>
                  onFilterChange({
                    ...filterOptions,
                    onWagon:
                      filterOptions.onWagon === false ? undefined : false,
                  })
                }
              >
                No
              </Button>
            </Box>
          </Box>

          {/* In Set Filter */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={{ fontSize: fontSizeSmall }}>
              In Set ({availableStats.inSetCount}):
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button
                variant={
                  filterOptions.inSet === true ? "contained" : "outlined"
                }
                color="success"
                size="small"
                sx={{ fontSize: fontSizeSmall, minWidth: 50, py: 0.2, px: 1 }}
                onClick={() =>
                  onFilterChange({
                    ...filterOptions,
                    inSet: filterOptions.inSet === true ? undefined : true,
                  })
                }
              >
                Yes
              </Button>
              <Button
                variant={
                  filterOptions.inSet === false ? "contained" : "outlined"
                }
                color="error"
                size="small"
                sx={{ fontSize: fontSizeSmall, minWidth: 50, py: 0.2, px: 1 }}
                onClick={() =>
                  onFilterChange({
                    ...filterOptions,
                    inSet: filterOptions.inSet === false ? undefined : false,
                  })
                }
              >
                No
              </Button>
            </Box>
          </Box>

          {/* Collection state filters */}
          <TriToggle
            label={"Is Listed (" + availableStats.isListedCount + ") :"}
            value={filterOptions.isListed}
            onChange={(v) => onFilterChange({ ...filterOptions, isListed: v })}
          />
          <TriToggle
            label={"Owned (" + availableStats.ownedCount + ") :"}
            value={filterOptions.owned}
            onChange={(v) => onFilterChange({ ...filterOptions, owned: v })}
          />
          <TriToggle
            label={"Delegated (" + availableStats.delegatedCount + ") :"}
            value={filterOptions.delegated}
            onChange={(v) => onFilterChange({ ...filterOptions, delegated: v })}
          />
          <TriToggle
            label={"Land Cooldown (" + availableStats.onLandCooldown + ") :"}
            value={filterOptions.landCooldown}
            onChange={(v) =>
              onFilterChange({ ...filterOptions, landCooldown: v })
            }
          />
          <TriToggle
            label={
              "Survival Cooldown (" + availableStats.onSurvivalCoolDown + ") :"
            }
            value={filterOptions.survivalCooldown}
            onChange={(v) =>
              onFilterChange({ ...filterOptions, survivalCooldown: v })
            }
          />
        </Box>

        {/* Min PP Filter */}
        <Box sx={{ minWidth: 200, maxWidth: 300 }}>
          <TextField
            label="Min PP"
            type="number"
            value={filterOptions.minPP}
            onChange={(e) => handleMinPPChange(Number(e.target.value))}
            size="small"
            fullWidth
            inputProps={{ min: 0, max: availableStats.maxPP, step: 10 }}
            helperText={`Max: ${availableStats.maxPP}`}
          />
        </Box>

        {/* Last-used Filter (min days since last used; 0 = off) */}
        <Box sx={{ minWidth: 200, maxWidth: 300 }}>
          <TextField
            label="Not used in (days)"
            type="number"
            value={filterOptions.lastUsedDays ?? 0}
            onChange={(e) =>
              onFilterChange({
                ...filterOptions,
                lastUsedDays: Number(e.target.value),
              })
            }
            size="small"
            fullWidth
            inputProps={{ min: 0, step: 1 }}
            helperText="0 = any"
          />
        </Box>

        {/* Rarity Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Rarity:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap" }}>
            {cardRarityOptions.map((rarity) => (
              <FilterIcon
                key={rarity}
                name={rarity}
                isActive={filterOptions.rarities.includes(rarity)}
                image={cardIconMap[rarity]}
                onChange={() => handleRarityToggle(rarity)}
              />
            ))}
          </Box>
        </Box>

        {/* Set / Edition Filter */}
        <LandEditionSetFilter
          value={{
            editions: filterOptions.editions,
            promoSets: filterOptions.promoSets,
            rewardSets: filterOptions.rewardSets,
            extraSets: filterOptions.extraSets,
          }}
          onChange={(v) => onFilterChange({ ...filterOptions, ...v })}
        />

        {/* Foil Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Foil:
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {cardFoilOptions.map((foil) => (
              <Box
                key={foil}
                onClick={() => handleFoilToggle(foil)}
                sx={{
                  border: "3px solid",
                  borderColor: filterOptions.foils.includes(foil)
                    ? "secondary.main"
                    : "grey.400",
                  borderRadius: 1,
                  overflow: "hidden",
                  cursor: "pointer",
                  display: "inline-block",
                }}
                title={foil}
              >
                <FoilIcon
                  foil={foil}
                  size={35}
                  fontSizeRatio={0.6}
                  fontWeight={900}
                  letterSpacing={0.5}
                  enhancedShadow
                />
              </Box>
            ))}
          </Box>
        </Box>

        {/* Element Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Element:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap" }}>
            {cardElementOptions.map((element) => (
              <FilterIcon
                key={element}
                name={element}
                isActive={filterOptions.elements.includes(element)}
                image={getElementIcon(element)}
                onChange={() => handleElementToggle(element)}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
