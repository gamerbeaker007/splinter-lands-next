import { useFilters } from "@/lib/frontend/context/FilterContext";
import {
  land_under_construction_icon_url,
  WEB_URL,
} from "@/lib/shared/statics_icon_urls";
import IconFilterGroup from "../shared/IconFilterGroup";

type Props = {
  options: string[];
};

export default function FilterDeedTypeGroup({ options }: Props) {
  const { filters, setFilters } = useFilters();
  if (options.length === 0) return null;

  const selected = Array.isArray(filters.filter_deed_type)
    ? filters.filter_deed_type
    : [];

  const deedTypeIconUrl = `${WEB_URL}website/ui_elements/lands/sideMenu/__NAME__Off.svg`;

  const onToggle = (name: string) => {
    const updated = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    setFilters((prev) => ({ ...prev, filter_deed_type: updated }));
  };

  return (
    <IconFilterGroup
      label="Geography"
      options={options}
      selected={selected}
      onToggle={onToggle}
      getImage={(name) =>
        name.startsWith("Unsurveyed")
          ? land_under_construction_icon_url
          : deedTypeIconUrl.replace("__NAME__", name.toLowerCase())
      }
    />
  );
}
