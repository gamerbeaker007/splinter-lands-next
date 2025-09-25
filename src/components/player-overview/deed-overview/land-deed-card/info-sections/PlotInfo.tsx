import {
  land_region_icon_url,
  land_tract_icon_url,
  land_plot_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { getDeedGeographyImg } from "@/lib/utils/deedUtil";
import { CSSSize } from "@/types/cssSize";
import { Avatar, Box, Stack, Typography } from "@mui/material";

export type Props = {
  imageUrl?: string | null;
  deedType: string;
  territory: string;
  regionName: string;
  regionNumber: number | string;
  tractNumber: number | string;
  plotNumber: number | string;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const PlotInfo: React.FC<Props> = ({
  deedType,
  territory,
  regionName,
  regionNumber,
  tractNumber,
  plotNumber,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const imageUrl = getDeedGeographyImg(deedType);

  const { x, y, w } = pos;
  const iconSize = 20;
  const fontSize = 12;

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: "left",
      }}
    >
      <Box display={"flex"} flexDirection={"row"} m={1} gap={1}>
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={deedType}
            mt={1}
            mr={1}
            sx={{ width: 50, height: 50 }}
          />
        ) : (
          <Typography variant="h4" fontWeight="bold">
            ❓
          </Typography>
        )}

        <Stack>
          <Typography variant="subtitle1" fontWeight="bold" color="white">
            {deedType}
          </Typography>

          <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
            {territory}
          </Typography>
          <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
            {regionName}
          </Typography>
        </Stack>
      </Box>

      <Stack
        direction="row"
        justifyContent="center"
        alignItems="center"
        spacing={1}
        mt={1}
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
    </Box>
  );
};
