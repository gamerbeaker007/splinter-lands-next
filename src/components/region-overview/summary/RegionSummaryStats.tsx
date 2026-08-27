import DecInfoTooltip from "@/components/region-overview/summary/DecIInfoToolTip";
import DecStakeIndicator from "@/components/region-overview/summary/DECStakeIndicator";
import { formatCompactNumber } from "@/lib/formatters";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import Paper from "@mui/material/Paper";
import React from "react";

type Props = {
  deedsCount: number;
  totalDecNeeded: number;
  totalDecInUse: number;
  totalDecStaked: number;
  totalDecSaved: number;
  runiCount: number;
};

const RegionSummaryStats: React.FC<Props> = ({
  deedsCount,
  totalDecNeeded,
  totalDecInUse,
  totalDecStaked,
  totalDecSaved,
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
          totalDecSaved={totalDecSaved}
          maxDecPossible={maxDecPossible}
          runiStakedDEC={runiStakedDEC}
        />
      </Box>
      <Box p={2}>
        <Typography variant="h6">Total Deeds:</Typography>
        <Typography variant="body2">
          {formatCompactNumber(deedsCount, { maximumFractionDigits: 2 })} / 150K
        </Typography>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        flexDirection={isSmallScreen ? "column" : "row"}
        gap={1}
        mb={2}
      >
        <DecStakeIndicator
          title="DEC Staked (all land)"
          maxPossibleStakedDec={maxDecPossible}
          totalDecStaked={totalDecStaked}
          totalDecNeeded={totalDecNeeded}
          totalDecSaved={totalDecSaved}
          runiStakedDEC={runiStakedDEC}
        />
        <DecStakeIndicator
          title="DEC Staked (selected)"
          maxPossibleStakedDec={Math.max(
            totalDecNeeded + totalDecSaved + runiStakedDEC,
            totalDecStaked
          )}
          totalDecStaked={totalDecStaked}
          totalDecNeeded={totalDecNeeded}
          totalDecSaved={totalDecSaved}
          runiStakedDEC={runiStakedDEC}
        />
      </Box>
    </Paper>
  );
};

export default RegionSummaryStats;
