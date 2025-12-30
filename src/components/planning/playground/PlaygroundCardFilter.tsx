"use client";

import FilterIcon from "@/components/filter/FilterIcon";
import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { CardFilterOptions } from "@/types/cardFilter";
import { CardSetNameLandValid, landCardSet } from "@/types/editions";
import {
  CardElement,
  cardElementOptions,
  CardFoil,
  cardFoilOptions,
  cardIconMap,
  CardRarity,
  cardRarityOptions,
  cardSetIconMap,
} from "@/types/planner";
import { PlaygroundCard } from "@/types/playground";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { TbCardsFilled } from "react-icons/tb";

type PlaygroundCardFilterProps = {
  cards: PlaygroundCard[];
  filteresCardCount?: number;
  assingesCardCount?: number;
  filterOptions: CardFilterOptions;
  onFilterChange: (newFilters: CardFilterOptions) => void;
};

export default function PlaygroundCardFilter({
  cards,
  filteresCardCount,
  assingesCardCount,
  filterOptions,
  onFilterChange,
}: PlaygroundCardFilterProps) {
  const availableStats = useMemo(() => {
    const onWagonCount = cards.filter((c) => c.onWagon).length;
    const inSetCount = cards.filter((c) => c.inSet).length;
    const maxPP = Math.max(...cards.map((c) => c.landBasePP), 0);

    return { onWagonCount, inSetCount, maxPP };
  }, [cards]);

  const handleRarityToggle = (rarity: CardRarity) => {
    const updated = filterOptions.rarities.includes(rarity)
      ? filterOptions.rarities.filter((r) => r !== rarity)
      : [...filterOptions.rarities, rarity];
    onFilterChange({ ...filterOptions, rarities: updated });
  };

  const handleSetToggle = (set: CardSetNameLandValid) => {
    const updated = filterOptions.sets.includes(set)
      ? filterOptions.sets.filter((s) => s !== set)
      : [...filterOptions.sets, set];
    onFilterChange({ ...filterOptions, sets: updated });
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

  const renderFoilIcon = (foil: CardFoil, size = 35) => {
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
    const badgeFont = Math.max(10, Math.floor(size * 0.6));

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
              letterSpacing: 0.5,
              userSelect: "none",
              textShadow:
                badgeColor === "black"
                  ? "0 0 2px rgba(255,255,255,0.9)"
                  : "0 0 2px rgba(0,0,0,0.8)",
            }}
          >
            {badgeText}
          </Typography>
        )}
      </Box>
    );
  };

  const getElementIcon = (element: string) => {
    return land_default_element_icon_url_placeholder.replace(
      "__NAME__",
      element.toLowerCase()
    );
  };

  const runiCount = cards.filter((card) => card.cardDetailId === 505).length;

  const fontSizeSmall = "0.8rem";

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
          Assigned Cards: {assingesCardCount}
        </Typography>
        <Typography variant="caption" gutterBottom>
          Filtered Cards: {filteresCardCount}
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

        {/* Rarity Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Rarity:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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

        {/* Set Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Card Set:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {landCardSet.map((set) => (
              <FilterIcon
                key={set}
                name={set}
                isActive={filterOptions.sets.includes(set)}
                image={cardSetIconMap[set]}
                onChange={() => handleSetToggle(set)}
              />
            ))}
          </Box>
        </Box>

        {/* Foil Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Foil:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
                  padding: "2px",
                  margin: "5px",
                }}
                title={foil}
              >
                {renderFoilIcon(foil)}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Element Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Element:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
