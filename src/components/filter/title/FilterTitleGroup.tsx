import IconFilterGroup from "@/components/filter/shared/IconFilterGroup";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { cardIconMap, titleOptions, TitleTier } from "@/types/planner";

type Props = {
  options: Exclude<TitleTier, "none">[];
};

export default function FilterTitleGroup({ options }: Props) {
  const { filters, setFilters } = useFilters();
  if (options.length === 0) return null;

  const selected = Array.isArray(filters.filter_title_tier)
    ? filters.filter_title_tier
    : [];

  const allIconOptions = titleOptions.filter(
    (tier): tier is Exclude<TitleTier, "none"> => tier !== "none"
  );

  const iconOptions = allIconOptions.filter((tier) => options.includes(tier));

  const onToggle = (tier: Exclude<TitleTier, "none">) => {
    const current = Array.isArray(filters.filter_title_tier)
      ? filters.filter_title_tier
      : [];
    const updated = current.includes(tier)
      ? current.filter((item) => item !== tier)
      : [...current, tier];

    setFilters((prev) => ({
      ...prev,
      filter_title_tier: updated,
    }));
  };

  return (
    <IconFilterGroup
      label="Title"
      options={iconOptions}
      selected={selected}
      onToggle={onToggle}
      getImage={(tier) => cardIconMap[tier]}
    />
  );
}
