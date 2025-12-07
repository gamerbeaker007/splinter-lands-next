import { useFilters } from "@/lib/frontend/context/FilterContext";
import {
  land_default_off_icon_url_placeholder,
  land_mythic_icon_url,
} from "@/lib/shared/statics_icon_urls";
import FilterIcon from "../FilterIcon";

type FilterIconProps = {
  name: string;
};

export default function FilterRarityIcon({ name }: FilterIconProps) {
  const { filters, setFilters } = useFilters();

  //Skip empty name
  if (!name) {
    return null;
  }

  const image =
    name == "mythic"
      ? land_mythic_icon_url
      : land_default_off_icon_url_placeholder.replace(
          "__NAME__",
          name.toLowerCase()
        );

  const value = filters.filter_rarity;
  const isArray = Array.isArray(value);
  const isActive = isArray ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item: string | number) => item !== name)
      : [...current, name];

    setFilters((prev) => ({ ...prev, filter_rarity: updated }));
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
