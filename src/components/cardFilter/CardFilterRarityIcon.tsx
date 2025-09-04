import { cardIconMap, CardRarity } from "@/types/planner";
import FilterIcon from "../filter/FilterIcon";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";

type Props = {
  name: string;
};

export default function CardFilterRarityIcon({ name }: Props) {
  const { cardFilters, setCardFilters } = useCardFilters();

  //Skip empty name
  if (!name) {
    return null;
  }

  const image = cardIconMap[name];

  const value = cardFilters.filter_rarity;
  const isArray = Array.isArray(value);
  const isActive = isArray ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item: CardRarity) => item !== name)
      : [...current, name];

    setCardFilters((prev) => ({ ...prev, filter_rarity: updated }));
  };

  return (
    <FilterIcon
      name={name}
      isActive={isActive}
      image={image}
      onChange={toggleFilter}
    />
  );
}
