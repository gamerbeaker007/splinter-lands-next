import React from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { formatNumberWithSuffix } from "@/lib/formatters";
import DecInfoTooltip from "@/components/region-overview/summary/DecIInfoToolTip";
import DecGaugeIndicator from "@/components/region-overview/summary/DecGaugeIndicator";
import Paper from "@mui/material/Paper";

type Props = {
  deedsCount: number;
  totalDecNeeded: number;
  totalDecInUse: number;
  totalDecStaked: number;
  runiCount: number;
};

const RegionSummaryStats: React.FC<Props> = ({
  deedsCount,
  totalDecNeeded,
  totalDecInUse,
  totalDecStaked,
  runiCount,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const maxDecPossible = 150_000 * 50_000;
  const runiStakedDEC = runiCount * 50_000;

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <Box display="flex" alignItems="center" p={2}>
        <Typography variant="h6">Land staked DEC Info</Typography>
        <DecInfoTooltip
          totalDecStaked={totalDecStaked}
          totalDecNeeded={totalDecNeeded}
          totalDecInUse={totalDecInUse}
          maxDecPossible={maxDecPossible}
          runiStakedDEC={runiStakedDEC}
        />
      </Box>
      <Box p={2}>
        <Typography variant="h6">Total Deeds:</Typography>
        <Typography variant="body2">
          {formatNumberWithSuffix(deedsCount)} / 150K
        </Typography>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        flexDirection={isSmallScreen ? "column" : "row"}
        gap={1}
        mb={2}
      >
        <DecGaugeIndicator
          title="DEC Staked (all land)"
          maxPossibleStakedDec={maxDecPossible}
          totalDecStaked={totalDecStaked}
          totalDecNeeded={totalDecNeeded}
          runiStakedDEC={runiStakedDEC}
        />
        <DecGaugeIndicator
          title="DEC Staked (selected)"
          maxPossibleStakedDec={
            Math.max(totalDecNeeded, totalDecStaked) + runiStakedDEC
          }
          totalDecStaked={totalDecStaked}
          totalDecNeeded={totalDecNeeded}
          runiStakedDEC={runiStakedDEC}
        />
      </Box>
    </Paper>
  );
};

export default RegionSummaryStats;
