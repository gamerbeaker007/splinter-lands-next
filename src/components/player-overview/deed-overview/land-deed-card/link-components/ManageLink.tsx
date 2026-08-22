"use client";

import {
  getLandManagerProductionLink,
  getManageLinkPlot,
} from "@/lib/utils/deedUtil";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import { useMemo, useState } from "react";

export type Props = {
  regionNumber: number;
  plotId: number;
  tractNumber: number;
  plotNumber: number;
};

export const ManageLink: React.FC<Props> = ({
  regionNumber,
  plotId,
  tractNumber,
  plotNumber,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const managePlotUrl = getManageLinkPlot(regionNumber, plotId);
  const landManagerUrl = useMemo(() => {
    return getLandManagerProductionLink(regionNumber, tractNumber, plotNumber);
  }, [regionNumber, tractNumber, plotNumber]);

  const closeMenu = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Manage Plot">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            bgcolor: "rgba(255,255,255,0.85)",
            "&:hover": { bgcolor: "rgba(255,255,255,1)" },
          }}
        >
          <SettingsOutlinedIcon fontSize="small" htmlColor="#666" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          component={Link}
          href={managePlotUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          Open in Splinterlands
        </MenuItem>
        <MenuItem
          component={Link}
          href={landManagerUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!landManagerUrl}
          onClick={closeMenu}
        >
          Open in Land Manager
        </MenuItem>
      </Menu>
    </>
  );
};
