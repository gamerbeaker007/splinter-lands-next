import { Resource } from "@/constants/resource/resource";
import { formatCompactNumber } from "@/lib/formatters";
import { RESOURCE_COLOR_MAP, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { capitalize, Chip, Tooltip } from "@mui/material";
import Image from "next/image";

export function getResourceIconUrl(resource: Resource): string {
  return RESOURCE_ICON_MAP[resource] ?? land_hammer_icon_url;
}

export function renderResourceIcon(resource: Resource, size = 16) {
  return (
    <Image
      src={getResourceIconUrl(resource)}
      alt={capitalize(resource.toLowerCase())}
      width={size}
      height={size}
    />
  );
}

export function renderResourceChip(
  resource: Resource,
  amount: number,
  largeFormat = false
) {
  return (
    <Tooltip
      key={resource + Math.random()}
      title={capitalize(resource.toLowerCase())}
      placement={"top"}
      followCursor={true}
    >
      <Chip
        variant={"outlined"}
        icon={renderResourceIcon(resource)}
        label={
          largeFormat
            ? formatCompactNumber(amount)
            : formatCompactNumber(amount)
        }
        size="small"
        sx={{
          borderColor: RESOURCE_COLOR_MAP[resource],
          fontWeight: "bold",
        }}
      />
    </Tooltip>
  );
}
