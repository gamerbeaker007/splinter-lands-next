import React from "react";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { WEB_URL } from "@/scripts/statics_icon_urls";
import FilterIcon from "../FilterIcon";

type FilterIconProps = {
  name: string;
};

const landPlotIconUrl = `${WEB_URL}website/ui_elements/lands/sideMenu/__NAME__Off.svg`;

export default function FilterPlotStatusIcon({ name }: FilterIconProps) {
  const { filters, setFilters } = useFilters();

  //Skip empty name
  if (!name) {
    return null;
  }

  const image = landPlotIconUrl.replace("__NAME__", name.toLowerCase());

  const value = filters.filter_plot_status;
  const isArray = Array.isArray(value);
  const isActive = isArray ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item: string | number) => item !== name)
      : [...current, name];

    setFilters((prev) => ({ ...prev, filter_plot_status: updated }));
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
