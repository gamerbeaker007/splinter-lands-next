import React from "react";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import FilterIcon from "../FilterIcon";

type FilterIconProps = {
  name: string;
};

export default function FilterResourceIcon({ name }: FilterIconProps) {
  const { filters, setFilters } = useFilters();

  if (!name) {
    console.warn("Missing displayName prop");
    return null;
  }

  const image = RESOURCE_ICON_MAP[name];

  const value = filters.filter_resources;
  const isArray = Array.isArray(value);
  const isActive = isArray ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item: string | number) => item !== name)
      : [...current, name];
    setFilters((prev) => ({ ...prev, filter_resources: updated }));
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
