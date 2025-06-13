import {
  formatNumber,
  toPascalCaseLabel,
} from "@/scripts/lib/utils/string_util";
import { Paper, Typography } from "@mui/material";
import { Box } from "@mui/system";
import Image from "next/image";

type SummaryTileProps = {
  type: string;
  imageUrl: string;
  count: number;
  info?: string;
};

export default function SummaryTile({
  type,
  imageUrl,
  info,
  count,
}: SummaryTileProps) {
  return (
    <>
      <Paper
        key={type}
        elevation={2}
        sx={{
          width: 70,
          height: 115,
          p: 1,
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        title={type}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 40,
            minHeight: 40,
            mb: 1,
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Image
            src={imageUrl}
            alt={type}
            fill
            sizes="100px"
            style={{ objectFit: "contain" }}
          />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          fontSize={12}
          sx={{ minHeight: 20 }}
        >
          ({formatNumber(count)})
        </Typography>
        <Typography
          variant="body2"
          fontWeight="bold"
          align="center"
          fontSize={12}
          sx={{ minHeight: 20 }}
        >
          {toPascalCaseLabel(type)}
        </Typography>
        {info ? (
          <Typography
            variant="caption"
            align="center"
            fontSize={10}
            sx={{ minHeight: 25 }}
          >
            {info}
          </Typography>
        ) : (
          <Typography sx={{ minHeight: 20 }} />
        )}
      </Paper>
    </>
  );
}
