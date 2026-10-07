"use client";

import { ContentCopy, Delete, MoreVert } from "@mui/icons-material";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { useState } from "react";

interface Props {
  onDuplicate?: () => void;
  onDelete?: () => void;
}

/** The ⋮ menu holding a row's duplicate / delete actions. */
export default function CustomPlanRowMenu({ onDuplicate, onDelete }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (!onDuplicate && !onDelete) return null;

  function run(fn: () => void) {
    setAnchor(null);
    fn();
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label="Row actions"
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {onDuplicate && (
          <MenuItem onClick={() => run(onDuplicate)}>
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate row</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => run(onDelete)} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete row</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
