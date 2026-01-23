import { Box, Divider, Typography } from "@mui/material";

interface RankedItemBoxProps {
  rank: number;
  value: string | number;
  subValue?: string | number | undefined;
  otherSubValues?: (string | number | undefined)[];
  showDivider?: boolean;
  highlight?: boolean;
}

export const RankedItemBox: React.FC<RankedItemBoxProps> = ({
  rank,
  value,
  subValue,
  otherSubValues,
  showDivider = true,
  highlight = false,
}) => {
  // Remove undefined, then join with en dash
  const subValues = otherSubValues
    ? `(${otherSubValues.filter(Boolean).join("–")})`
    : "";

  return (
    <Box
      sx={{
        backgroundColor: highlight ? "rgba(239, 68, 68, 0.1)" : "transparent",
        borderLeft: highlight ? "3px solid #ef4444" : "none",
      }}
    >
      <Box display="flex" alignItems="center" ml={1}>
        <Box minWidth={85} display={"flex"}>
          <Box width={30}>
            <Typography
              variant="body2"
              fontWeight="medium"
              fontSize={14}
              color="secondary.main"
            >
              {rank}.
            </Typography>
          </Box>
          <Box mr={1}>
            <Typography variant="body2" fontWeight="medium" fontSize={14}>
              {value}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center">
          <Typography
            variant="caption"
            color="text.secondary"
            fontSize={12}
            sx={{ wordBreak: "break-word" }}
          >
            {subValue} {subValues}
          </Typography>
        </Box>
      </Box>
      {showDivider && <Divider sx={{ mb: 0.2 }} />}
    </Box>
  );
};
