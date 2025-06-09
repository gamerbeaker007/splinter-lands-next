import React from "react";
import { useFilters } from "@/lib/context/FilterContext";
import { WEB_URL } from "@/scripts/statics_icon_urls";
import FilterIcon from "../FilterIcon";

type FilterIconProps = {
  name: string;
};

const land_rarity_icon_url = `${WEB_URL}website/ui_elements/lands/sideMenu/__NAME__Off.svg`;
const land_mythic_icon_url = `${WEB_URL}website/ui_elements/lands/sideMenu/legendaryOff.svg`;

export default function FilterRarityIcon({ name }: FilterIconProps) {
  const { filters, setFilters } = useFilters();

  //Skip empty name
  if (!name) {
    return null;
  }

  const image =
    name == "mythic"
      ? land_mythic_icon_url
      : land_rarity_icon_url.replace("__NAME__", name.toLowerCase());

  const value = filters.filter_rarity;
  const isArray = Array.isArray(value);
  const isActive = isArray ? value.includes(name) : false;

  const toggleFilter = () => {
    const current = Array.isArray(value) ? value : [];
    const updated = isActive
      ? current.filter((item: string | number) => item !== name)
      : [...current, name];

    setFilters((prev) => ({ ...prev, filter_rarity: updated }));
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
