import IconFilterGroup from "@/components/filter/shared/IconFilterGroup";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { totemIconMap } from "@/lib/shared/statics";
import { totemOptions, TotemTier } from "@/types/planner";

type Props = {
  options: Exclude<TotemTier, "none">[];
};

export default function FilterTotemGroup({ options }: Props) {
  const { filters, setFilters } = useFilters();

  if (options.length === 0) return null;

  const selected = Array.isArray(filters.filter_totem_tier)
    ? filters.filter_totem_tier
    : [];

  const allIconOptions = totemOptions.filter(
    (tier): tier is Exclude<TotemTier, "none"> => tier !== "none"
  );

  const iconOptions = allIconOptions.filter((tier) => options.includes(tier));

  const onToggle = (tier: Exclude<TotemTier, "none">) => {
    const current = Array.isArray(filters.filter_totem_tier)
      ? filters.filter_totem_tier
      : [];
    const updated = current.includes(tier)
      ? current.filter((item) => item !== tier)
      : [...current, tier];

    setFilters((prev) => ({
      ...prev,
      filter_totem_tier: updated,
    }));
  };

  return (
    <IconFilterGroup
      label="Totem"
      options={iconOptions}
      selected={selected}
      onToggle={onToggle}
      getImage={(tier) => totemIconMap[tier]}
    />
  );
}
