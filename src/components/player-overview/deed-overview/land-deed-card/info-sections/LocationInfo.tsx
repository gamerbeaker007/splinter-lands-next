import {
  land_plot_icon_url,
  land_region_icon_url,
  land_tract_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Avatar, Stack, Typography } from "@mui/material";

export type Props = {
  regionNumber: number | string;
  tractNumber: number | string;
  plotNumber: number | string;
};

export const LocationInfo: React.FC<Props> = ({
  regionNumber,
  tractNumber,
  plotNumber,
}) => {
  const iconSize = 20;
  const fontSize = 12;

  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      spacing={1}
      sx={{
        width: "90%",
        minWidth: 160,
        maxWidth: 240,
        backgroundColor: "rgba(240, 240, 240, 0.85)",
        color: "#333",
        borderRadius: 1,
        py: 0.5,
      }}
    >
      <Avatar
        src={land_region_icon_url}
        alt="region"
        sx={{ width: iconSize, height: iconSize }}
      />
      <Typography variant="caption" fontSize={fontSize}>
        {regionNumber}
      </Typography>

      <Avatar
        src={land_tract_icon_url}
        alt="tract"
        sx={{ width: iconSize, height: iconSize }}
      />
      <Typography variant="caption" fontSize={fontSize}>
        {tractNumber}
      </Typography>

      <Avatar
        src={land_plot_icon_url}
        alt="plot"
        sx={{ width: iconSize, height: iconSize }}
      />
      <Typography variant="caption" fontSize={fontSize}>
        {plotNumber}
      </Typography>
    </Stack>
  );
};
