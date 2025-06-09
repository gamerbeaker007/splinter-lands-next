import React from "react";
import { useFilters } from "@/lib/context/FilterContext";
import {
  land_under_construction_icon_url,
  WEB_URL,
} from "@/scripts/statics_icon_urls";
import FilterIcon from "../FilterIcon";

type FilterIconProps = {
  name: string;
};

const deed_type_icon_url = `${WEB_URL}website/ui_elements/lands/sideMenu/__NAME__Off.svg`;

export default function FilterDeedTypeIcon({ name }: FilterIconProps) {
  const { filters, setFilters } = useFilters();

  if (!name) {
    console.warn("Missing displayName prop");
    return null;
  }

  let image = "";
  if (name.startsWith("Unsurveyed")) {
    image = land_under_construction_icon_url;
  } else {
    image = deed_type_icon_url.replace("__NAME__", name.toLowerCase());
  }

  const value = filters.filter_deed_type;
  const isArray = Array.isArray(value);
  const isActive = isArray ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item: string | number) => item !== name)
      : [...current, name];
    setFilters((prev) => ({ ...prev, filter_deed_type: updated }));
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
