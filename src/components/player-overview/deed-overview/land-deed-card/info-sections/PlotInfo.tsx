import { getDeedGeographyImg } from "@/lib/utils/deedUtil";
import { CSSSize } from "@/types/cssSize";
import { Box, Stack, Typography } from "@mui/material";
import { LocationInfo } from "./LocationInfo";

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

      <LocationInfo
        regionNumber={regionNumber}
        tractNumber={tractNumber}
        plotNumber={plotNumber}
      />
    </Box>
  );
};
