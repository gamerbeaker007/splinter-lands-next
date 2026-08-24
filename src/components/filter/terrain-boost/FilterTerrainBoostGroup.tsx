import { useFilters } from "@/lib/frontend/context/FilterContext";
import { getElementIconUrl } from "@/lib/frontend/utils/icons";
import { CardElement, cardElementOptions } from "@/types/planner";
import IconFilterGroup from "../shared/IconFilterGroup";

type Props = {
  options?: CardElement[];
};

// Define custom sort order
const elementOrder: Record<CardElement, number> = {
  fire: 0,
  water: 1,
  life: 2,
  death: 3,
  earth: 4,
  dragon: 5,
  neutral: 6,
};

export default function FilterTerrainBoostGroup({ options }: Props) {
  const { filters, setFilters } = useFilters();

  const rawOptions =
    options && options.length > 0
      ? options
      : cardElementOptions.filter(
          (element): element is Exclude<CardElement, "neutral"> =>
            element !== "neutral"
        );

  const sortedOptions = [...rawOptions].sort((a, b) => {
    const aRank = elementOrder[a] ?? Infinity;
    const bRank = elementOrder[b] ?? Infinity;
    return aRank - bRank;
  });

  const selected = Array.isArray(filters.filter_positive_terrain_elements)
    ? filters.filter_positive_terrain_elements
    : [];

  const onToggle = (name: CardElement) => {
    const updated = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    setFilters((prev) => ({
      ...prev,
      filter_positive_terrain_elements: updated,
    }));
  };

  return (
    <IconFilterGroup
      label="Positive Terrain Boost"
      options={sortedOptions}
      selected={selected}
      onToggle={onToggle}
      getImage={(name) => getElementIconUrl(name)}
    />
  );
}
