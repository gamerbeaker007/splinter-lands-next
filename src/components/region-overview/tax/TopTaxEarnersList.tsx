import {
  dec_icon_url,
  land_castle_icon_url,
  land_keep_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { RegionTax } from "@/types/regionTax";
import { Box, Card, Typography } from "@mui/material";
import Image from "next/image";
import { RankedItemBox } from "@/components/region-overview/RankedItemBox";

type TopTaxEarnersListProps = {
  data: RegionTax[];
  type: "castle" | "keep";
  title?: string;
};

export function TopTaxEarnersList({
  data,
  type,
  title,
}: TopTaxEarnersListProps) {
  const earners: {
    totalDEC: number;
    player: string;
    regionUid: string;
    tractNumber?: number;
    plotNumber?: number;
  }[] = [];

  for (const region of data) {
    if (type === "castle") {
      const totalDEC = Object.values(region.capturedTaxInDEC).reduce(
        (a, b) => a + b,
        0,
      );
      if (totalDEC > 0) {
        earners.push({
          totalDEC,
          player: region.castleOwner.player ?? "unknown",
          regionUid: region.castleOwner.regionUid,
          tractNumber: region.castleOwner.tractNumber,
          plotNumber: region.castleOwner.plotNumber,
        });
      }
    } else if (type === "keep") {
      for (const tract of Object.values(region.perTract)) {
        const totalDEC = Object.values(tract.capturedTaxInDEC).reduce(
          (a, b) => a + b,
          0,
        );
        if (totalDEC > 0) {
          const owner = tract.keepOwner;
          earners.push({
            totalDEC,
            player: owner.player ?? "unknown",
            regionUid: owner.regionUid,
            tractNumber: owner.tractNumber,
            plotNumber: owner.plotNumber,
          });
        }
      }
    }
  }

  earners.sort((a, b) => b.totalDEC - a.totalDEC);

  const imageUrl =
    type === "castle" ? land_castle_icon_url : land_keep_icon_url;

  return (
    <Box flex={1} minWidth="250px">
      <Card sx={{ p: 1 }}>
        <Box
          flexDirection="column"
          alignItems="center"
          textAlign="center"
          mb={2}
        >
          <Image src={imageUrl} alt={type} width={50} height={50} />
          <Image src={dec_icon_url} alt={type} width={40} height={40} />
          <Typography variant="subtitle1" fontWeight="bold">
            {title ?? `Top ${type} owners`}
          </Typography>
          <Typography
            variant="body2"
            fontWeight="medium"
            color="text.secondary"
          >
            {`(by DEC earning /hr)`}
          </Typography>
        </Box>
        {earners.slice(0, 10).map((e, i) => (
          <RankedItemBox
            key={`ranked-box-${e.regionUid}-${e.tractNumber ?? "NA"}`}
            rank={i + 1}
            value={e.totalDEC.toFixed(2)}
            subValue={e.player}
            otherSubValues={[e.regionUid, e.tractNumber, e.plotNumber]}
          />
        ))}
      </Card>
    </Box>
  );
}
