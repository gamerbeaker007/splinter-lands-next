import { useFilters } from "@/lib/frontend/context/FilterContext";
import { WEB_URL } from "@/lib/shared/statics_icon_urls";
import IconFilterGroup from "../shared/IconFilterGroup";

type Props = {
  options: string[];
};

// Define custom sort order
const plotStatusOrder: Record<string, number> = {
  natural: 0,
  magical: 1,
  occupied: 2,
  kingdom: 3,
  unknown: 4,
};

export default function FilterPlotStatusGroup({ options }: Props) {
  const { filters, setFilters } = useFilters();
  if (options.length === 0) return null;

  const sortedOptions = [...options].sort((a, b) => {
    const aRank = plotStatusOrder[a.toLowerCase()] ?? Infinity;
    const bRank = plotStatusOrder[b.toLowerCase()] ?? Infinity;
    return aRank - bRank;
  });

  const selected = Array.isArray(filters.filter_plot_status)
    ? filters.filter_plot_status
    : [];

  const landPlotIconUrl = `${WEB_URL}website/ui_elements/lands/sideMenu/__NAME__Off.svg`;

  const onToggle = (name: string) => {
    const updated = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    setFilters((prev) => ({ ...prev, filter_plot_status: updated }));
  };

  return (
    <IconFilterGroup
      label="Land Type"
      options={sortedOptions}
      selected={selected}
      onToggle={onToggle}
      getImage={(name) =>
        landPlotIconUrl.replace("__NAME__", name.toLowerCase())
      }
    />
  );
}
