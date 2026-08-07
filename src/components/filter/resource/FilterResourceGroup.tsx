import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import IconFilterGroup from "../shared/IconFilterGroup";

type Props = {
  options: string[];
};

// Define custom sort order
const resourceOrder: Record<string, number> = {
  grain: 0,
  wood: 1,
  stone: 2,
  iron: 3,
  aura: 4,
  tax: 5,
  research: 6,
  sps: 7,
};

export default function FilterResourceGroup({ options }: Props) {
  const { filters, setFilters } = useFilters();
  if (options.length === 0) return null;

  const sortedOptions = [...options].sort((a, b) => {
    const aRank = resourceOrder[a.toLowerCase()] ?? Infinity;
    const bRank = resourceOrder[b.toLowerCase()] ?? Infinity;
    return aRank - bRank;
  });

  const selected = Array.isArray(filters.filter_resources)
    ? filters.filter_resources
    : [];

  const onToggle = (name: string) => {
    const updated = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    setFilters((prev) => ({ ...prev, filter_resources: updated }));
  };

  return (
    <IconFilterGroup
      label="Resource"
      options={sortedOptions}
      selected={selected}
      onToggle={onToggle}
      getImage={(name) => RESOURCE_ICON_MAP[name] ?? ""}
    />
  );
}
