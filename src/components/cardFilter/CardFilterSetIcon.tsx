import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { CardSetNameLandValid } from "@/types/editions";
import { cardSetIconMap } from "@/types/planner";
import FilterIcon from "../filter/FilterIcon";

type Props = {
  name: CardSetNameLandValid;
};

export default function CardFilterSetIcon({ name }: Props) {
  const { cardFilters, setCardFilters } = useCardFilters();

  //Skip empty name
  if (!name) {
    return null;
  }

  const image = cardSetIconMap[name];

  const value = cardFilters.filter_set;
  const isArray = Array.isArray(value);
  const isActive = isArray ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item: CardSetNameLandValid) => item !== name)
      : [...current, name];

    setCardFilters((prev) => ({ ...prev, filter_set: updated }));
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
