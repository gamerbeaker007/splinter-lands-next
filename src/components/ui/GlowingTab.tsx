// GlowingTab.tsx
import Tab, { TabProps } from "@mui/material/Tab";
import { styled } from "@mui/material/styles";

export type GlowingTabProps = TabProps & {
  /** Use a more compact tab style (smaller height/padding/font). */
  compact?: boolean;
};

const StyledTab = styled(Tab, {
  // Prevent `compact` from being written to the DOM
  shouldForwardProp: (prop) => prop !== "compact",
})<GlowingTabProps>(({ theme, compact = false }) => ({
  position: "relative",
  transition: "all 0.2s ease-in-out",

  // Base (desktop/normal)
  fontSize: 13,
  minHeight: 34,
  padding: "8px 16px",
  marginLeft: 0,

  "& .MuiTab-wrapper": {
    lineHeight: 1.2,
    fontSize: 13,
  },

  // Hover glow
  "&:hover::before": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 30,
    height: 30,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: `radial-gradient(circle, ${theme.palette.primary.light} 0%, transparent 70%)`,
    zIndex: -1,
  },

  // Selected diamond marker
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

  // Compact overrides (mobile landscape / short screens)
  ...(compact && {
    fontSize: 12,
    minHeight: 20,
    padding: "0px 8px",
    marginLeft: 0,
    "& .MuiTab-wrapper": {
      fontSize: 12,
    },
    "&:hover::before": {
      width: 16,
      height: 16,
    },
  }),
}));

export default StyledTab;
