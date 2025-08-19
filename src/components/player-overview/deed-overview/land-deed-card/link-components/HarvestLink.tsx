import { getHarvestRegion } from "@/lib/utils/deedUtil";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import AgricultureOutlinedIcon from "@mui/icons-material/AgricultureOutlined";

export type Props = {
  regionNumber: number;
};

export const HarvestLink: React.FC<Props> = ({ regionNumber }) => {
  const harvestRegionUrl = getHarvestRegion(regionNumber);

  return (
    <Tooltip title="Harvest Region">
      <IconButton
        size="small"
        component={Link}
        href={harvestRegionUrl}
        target="_blank"
        sx={{
          bgcolor: "rgba(255,255,255,0.85)",
          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
        }}
      >
        <AgricultureOutlinedIcon fontSize="small" htmlColor="#666" />
      </IconButton>
    </Tooltip>
  );
};
