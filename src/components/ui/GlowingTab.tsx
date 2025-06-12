import { Tab, TabProps } from "@mui/material";
import { styled } from "@mui/system";
import React from "react";

const StyledTab = styled((props: TabProps) => <Tab {...props} />)(
  ({ theme }) => ({
    position: "relative",
    transition: "all 0.3s ease-in-out",
    "&:hover::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 40,
      height: 40,
      transform: "translate(-50%, -50%)",
      borderRadius: "50%",
      background: `radial-gradient(circle, ${theme.palette.primary.light} 0%, transparent 70%)`,
      zIndex: -1,
    },
    "&.Mui-selected::after": {
      content: '""',
      position: "absolute",
      bottom: -4,
      left: "50%",
      transform: "translateX(-50%) rotate(45deg)",
      width: 8,
      height: 8,
      backgroundColor: theme.palette.primary.main,
      zIndex: 1,
    },
  }),
);

export default StyledTab;
