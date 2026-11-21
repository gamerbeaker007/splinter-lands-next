"use client";

import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import Image from "next/image";

export function ResourceIconToggleGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; resource: string; label: string }[];
  value: T[];
  onChange: (value: T[]) => void;
  label: string;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      onChange={(_, selected: T[]) => onChange(selected)}
      aria-label={label}
      size="small"
      sx={{ display: "flex", flexWrap: "wrap", maxWidth: "100%" }}
    >
      {options.map((option) => (
        <Tooltip key={option.value} title={option.label}>
          <ToggleButton
            value={option.value}
            aria-label={option.label}
            sx={{ p: 0.75 }}
          >
            {RESOURCE_ICON_MAP[option.resource] ? (
              <Image
                src={RESOURCE_ICON_MAP[option.resource]}
                alt=""
                width={30}
                height={30}
              />
            ) : (
              option.resource
            )}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}
