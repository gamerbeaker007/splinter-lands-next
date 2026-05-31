import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { resourceWorksiteMap } from "@/types/planner/primitives";
import FilterIcon from "../FilterIcon";

type Props = {
  name: string;
};

/** Toggle button for a single worksite type. Uses the resource icon that the worksite produces. */
export default function FilterWorksiteIcon({ name }: Props) {
  const { filters, setFilters } = useFilters();

  // Map worksite type to its produced resource, then look up the icon.
  const resource =
    resourceWorksiteMap[name as keyof typeof resourceWorksiteMap];
  const image = resource ? (RESOURCE_ICON_MAP[resource] ?? "") : "";

  const value = filters.filter_worksites;
  const isActive = Array.isArray(value) ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item) => item !== name)
      : [...current, name];
    setFilters((prev) => ({ ...prev, filter_worksites: updated }));
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
