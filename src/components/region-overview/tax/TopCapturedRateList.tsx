import {
  land_castle_icon_url,
  land_keep_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { RegionTax } from "@/types/regionTax";
import { Box, Card, Divider, Typography } from "@mui/material";
import Image from "next/image";

type TopCaptureRateListProps = {
  data: RegionTax[];
  type: "castle" | "keep";
  title?: string;
};

export function TopCaptureRateList({
  data,
  type,
  title,
}: TopCaptureRateListProps) {
  const owners: {
    captureRate: number;
    player: string;
    regionUid: string;
    tractNumber?: number;
    plotNumber?: number;
  }[] = [];

  for (const region of data) {
    if (type === "castle" && region.castleOwner.captureRate !== undefined) {
      owners.push({
        captureRate: region.castleOwner.captureRate,
        player: region.castleOwner.player ?? "unknown",
        regionUid: region.castleOwner.regionUid,
        tractNumber: region.castleOwner.tractNumber,
        plotNumber: region.castleOwner.plotNumber,
      });
    } else if (type === "keep") {
      for (const tract of Object.values(region.perTract)) {
        const owner = tract.keepOwner;
        if (owner.captureRate !== undefined) {
          owners.push({
            captureRate: owner.captureRate,
            player: owner.player ?? "unknown",
            regionUid: owner.regionUid,
            tractNumber: owner.tractNumber,
            plotNumber: owner.plotNumber,
          });
        }
      }
    }
  }

  owners.sort((a, b) => b.captureRate - a.captureRate);

  const imageUrl =
    type === "castle" ? land_castle_icon_url : land_keep_icon_url;

  return (
    <Box flex={1} minWidth={"250px"}>
      <Card sx={{ p: 1 }}>
        <Box
          flexDirection="column"
          alignItems="center"
          textAlign="center"
          mb={2}
        >
          <Image src={imageUrl} alt={type} width={50} height={50} />
          <Typography variant="subtitle1" fontWeight="bold">
            {title ?? `Top ${type} owners`}
          </Typography>
          <Typography
            variant="body2"
            fontWeight="medium"
            color="text.secondary"
          >
            {`(by capture rate)`}
          </Typography>
        </Box>
        {owners.slice(0, 10).map((o, i) => (
          <>
            <Box
              display={"flex"}
              alignItems="center"
              ml={1}
              key={`rank-${o.regionUid}-${o.tractNumber}`}
            >
              <Box key={`rate-${o.regionUid}-${o.tractNumber}`} minWidth={80}>
                <Typography variant="body2" fontWeight="medium" fontSize={14}>
                  {i + 1}. {(o.captureRate * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box key={`owner-${o.regionUid}-${o.tractNumber}`}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontSize={10}
                >
                  {o.player} ( {o.regionUid}
                  {o.tractNumber !== undefined ? `–${o.tractNumber}` : ""}
                  {o.plotNumber !== undefined ? `–${o.plotNumber}` : ""})
                </Typography>
              </Box>
            </Box>
            <Divider key={`div-${o.regionUid}-${o.tractNumber}`} />
          </>
        ))}
      </Card>
    </Box>
  );
}
