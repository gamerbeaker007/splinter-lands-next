import { useFilters } from "@/lib/frontend/context/FilterContext";
import {
  land_default_off_icon_url_placeholder,
  land_mythic_icon_url,
} from "@/lib/shared/statics_icon_urls";
import IconFilterGroup from "../shared/IconFilterGroup";

type Props = {
  options: string[];
};

// Define custom sort order
const rarityOrder: Record<string, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
};

export default function FilterRarityGroup({ options }: Props) {
  const { filters, setFilters } = useFilters();
  if (options.length === 0) return null;

  const sortedOptions = [...options].sort((a, b) => {
    const aRank = rarityOrder[a.toLowerCase()] ?? Infinity;
    const bRank = rarityOrder[b.toLowerCase()] ?? Infinity;
    return aRank - bRank;
  });

  const selected = Array.isArray(filters.filter_rarity)
    ? filters.filter_rarity
    : [];

  const getImage = (name: string) =>
    name === "mythic"
      ? land_mythic_icon_url
      : land_default_off_icon_url_placeholder.replace("__NAME__", name);

  const onToggle = (name: string) => {
    const updated = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    setFilters((prev) => ({ ...prev, filter_rarity: updated }));
  };

  return (
    <IconFilterGroup
      label="Rarity"
      options={sortedOptions}
      selected={selected}
      onToggle={onToggle}
      getImage={getImage}
    />
  );
}
