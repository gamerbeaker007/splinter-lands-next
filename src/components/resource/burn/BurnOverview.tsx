import { formatNumberWithSuffix } from "@/lib/formatters";
import {
  cinder_icon_url,
  dec_icon_url,
  glint_icon_url,
  merits_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { BurnCardsDataPoint } from "@/types/burn";
import { Box, Card, CardContent, Typography } from "@mui/material";
import Image from "next/image";

interface Props {
  latestData: BurnCardsDataPoint[];
}

export default function BurnOverview({ latestData }: Props) {
  const date = latestData[0].date;
  const tokens = [
    {
      label: "GLINT",
      value: latestData.find((d) => d.token === "GLINT")?.balance || 0,
      icon: glint_icon_url,
    },
    {
      label: "DEC",
      value: latestData.find((d) => d.token === "DEC")?.balance || 0,
      icon: dec_icon_url,
    },
    {
      label: "CINDER",
      value: latestData.find((d) => d.token === "CINDER")?.balance || 0,
      icon: cinder_icon_url,
    },
    {
      label: "MERITS",
      value: latestData.find((d) => d.token === "MERITS")?.balance || 0,
      icon: merits_icon_url,
    },
  ];
  return (
    <Box mb={3} flex={1}>
      <Typography variant="h5" mb={2}>
        Cards Burned For Tokens Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Latest data from {new Date(date).toLocaleDateString()}
      </Typography>
      <Box display="flex" flexDirection={"row"} flexWrap="wrap" gap={2}>
        {tokens.map((token) => (
          <Box key={token.label}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >
                  <Image
                    src={token.icon}
                    alt={token.label}
                    width={24}
                    height={24}
                  />
                  <Typography variant="caption">{token.label}</Typography>
                </Box>
                <Typography variant="h6">
                  {formatNumberWithSuffix(Number(token.value))}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
