import { getManageLinkPlot } from "@/lib/utils/deedUtil";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export type Props = {
  regionNumber: number;
  plotId: number;
};

export const ManageLink: React.FC<Props> = ({ regionNumber, plotId }) => {
  const managePlotUrl = getManageLinkPlot(regionNumber, plotId);

  return (
    <Tooltip title="Manage Plot">
      <IconButton
        size="small"
        component={Link}
        href={managePlotUrl}
        target="_blank"
        sx={{
          bgcolor: "rgba(255,255,255,0.85)",
          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
        }}
      >
        <SettingsOutlinedIcon fontSize="small" htmlColor="#666" />
      </IconButton>
    </Tooltip>
  );
};
