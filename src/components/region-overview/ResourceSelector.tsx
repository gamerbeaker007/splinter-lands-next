import Image from "next/image";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { Box, Stack, Button } from "@mui/material";

type ResourceSelectorProps = {
  resourceTypes: string[];
  selectedResource: string | null;
  onSelect: (resource: string | null) => void;
};

export const ResourceSelector = ({
  resourceTypes,
  selectedResource,
  onSelect,
}: ResourceSelectorProps) => (
  <Box display="flex" flexWrap="wrap" justifyContent="center">
    <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
      {resourceTypes.map((resource) => {
        const selected = selectedResource === resource;
        return (
          <Button
            key={resource}
            variant={selected ? "contained" : "outlined"}
            onClick={() => onSelect(selected ? null : resource)} // toggle on click
            sx={{ width: 100, height: 100, padding: 1 }}
          >
            <Image
              src={RESOURCE_ICON_MAP[resource]}
              alt={resource}
              width={75}
              height={75}
              style={{ maxWidth: "100%", maxHeight: "100%" }}
            />
          </Button>
        );
      })}
    </Stack>
  </Box>
);
