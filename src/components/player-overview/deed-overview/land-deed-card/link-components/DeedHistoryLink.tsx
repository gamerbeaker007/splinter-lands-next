import HistoryIcon from "@mui/icons-material/History";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";

export type Props = {
  deedUid: string;
};

export const DeedHistoryLink: React.FC<Props> = ({ deedUid }) => {
  const deedHistoryUrl = `/player-overview/deed-history/${deedUid}`;

  return (
    <Tooltip title="Deed History">
      <IconButton
        size="small"
        component={Link}
        href={deedHistoryUrl}
        sx={{
          bgcolor: "rgba(255,255,255,0.85)",
          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
        }}
      >
        <HistoryIcon fontSize="small" htmlColor="#666" />
      </IconButton>
    </Tooltip>
  );
};
