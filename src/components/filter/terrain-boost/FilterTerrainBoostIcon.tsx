import { useFilters } from "@/lib/frontend/context/FilterContext";
import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { CardElement } from "@/types/planner";
import FilterIcon from "../FilterIcon";

type FilterIconProps = {
  name: CardElement;
};

export default function FilterTerrainBoostIcon({ name }: FilterIconProps) {
  const { filters, setFilters } = useFilters();

  //Skip empty name
  if (!name) {
    return null;
  }

  const landElementIcon = land_default_element_icon_url_placeholder.replace(
    "__NAME__",
    name
  );

  const value = filters.filter_positive_terrain_elements;
  const isArray = Array.isArray(value);
  const isActive = isArray ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item) => item !== name)
      : [...current, name];

    setFilters((prev) => ({
      ...prev,
      filter_positive_terrain_elements: updated,
    }));
  };

  return (
    <FilterIcon
      name={name}
      isActive={isActive}
      image={landElementIcon}
      onChange={toggleFilter}
    />
  );
}
