import { worksiteTypeOptions } from "@/types/planner/primitives";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { resourceWorksiteMap } from "@/types/planner/primitives";
import IconFilterGroup from "../shared/IconFilterGroup";

type Props = {
  options: string[];
};

const worksiteOrder: Record<string, number> = Object.fromEntries(
  worksiteTypeOptions.map((w, i) => [w, i])
);

export default function FilterWorksiteGroup({ options }: Props) {
  const { filters, setFilters } = useFilters();
  if (options.length === 0) return null;

  const sortedOptions = [...options].sort(
    (a, b) => (worksiteOrder[a] ?? Infinity) - (worksiteOrder[b] ?? Infinity)
  );

  const selected = Array.isArray(filters.filter_worksites)
    ? filters.filter_worksites
    : [];

  const onToggle = (name: string) => {
    const updated = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    setFilters((prev) => ({ ...prev, filter_worksites: updated }));
  };

  const getImage = (name: string) => {
    const resource =
      resourceWorksiteMap[name as keyof typeof resourceWorksiteMap];
    return resource ? (RESOURCE_ICON_MAP[resource] ?? "") : "";
  };

  return (
    <IconFilterGroup
      label="Worksite"
      options={sortedOptions}
      selected={selected}
      onToggle={onToggle}
      getImage={getImage}
    />
  );
}
