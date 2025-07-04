import { dec_icon_url, sps_icon_url } from "@/scripts/statics_icon_urls";
import { Box, Typography } from "@mui/material";
import Image from "next/image";

type Props = {
  dec: number;
  sps: number;
};

export function ResourceOutput({ dec, sps }: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
      minWidth={100}
    >
      <Image src={dec_icon_url} alt="DEC" width={60} height={60} />
      <Typography variant="subtitle2">DEC</Typography>
      <Typography fontWeight="bold">{dec.toFixed(2)}</Typography>

      <Image
        src={sps_icon_url}
        alt="SPS"
        width={60}
        height={60}
        style={{ marginTop: 16 }}
      />
      <Typography variant="subtitle2">SPS</Typography>
      <Typography fontWeight="bold">{sps.toFixed(2)}</Typography>
    </Box>
  );
}
