import ResourcePPChart from "@/components/region-overview/tract-deed-overview/ResourcePPChart";
import ResourceRewardChart from "@/components/region-overview/tract-deed-overview/ResourceRewardChart";
import { Resource } from "@/constants/resource/resource";
import { ProductionPoints } from "@/types/productionPoints";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

type Props = {
  productionPoints: Record<Resource, ProductionPoints>;
  rewardsPerHour: Record<Resource, number>;
};

export function PlayerProductionOverview({
  productionPoints,
  rewardsPerHour,
}: Props) {
  return (
    <Box>
      <Box display={"flex"} flexDirection={"row"} gap={1}>
        <Typography variant={"h5"}>Resource Production Overview</Typography>
        <Tooltip
          title={
            <Box
              component="pre"
              sx={{ whiteSpace: "pre-line", fontSize: "0.75rem" }}
            >
              The rewards per hour are calculated without taking into account
              taxes and transfer fees, showing raw production values.
            </Box>
          }
          placement="top"
          arrow
        >
          <IconButton size="small" sx={{ padding: 0.25 }}>
            <InfoIcon fontSize="small" color="action" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        display="flex"
        flexDirection={"row"}
        flexWrap="wrap"
        gap={2}
        sx={{ width: "100%" }}
      >
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <ResourcePPChart production={productionPoints} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <ResourceRewardChart rewardsPerHour={rewardsPerHour} />
        </Box>
      </Box>
    </Box>
  );
}
