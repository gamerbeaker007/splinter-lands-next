import { dec_icon_url, sps_icon_url } from "@/lib/shared/statics_icon_urls";
import { Box, Skeleton, Typography } from "@mui/material";
import Image from "next/image";

type Props = {
  dec: number;
  sps: number;
  decExtra: number;
  loading?: boolean;
};

export function ResourceOutput({ dec, sps, decExtra, loading = false }: Props) {
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
      <Box display={"flex"} flexWrap={"wrap"} alignItems={"center"} gap={1}>
        {loading ? (
          <Skeleton variant="rectangular" width={80} height={24} />
        ) : (
          <>
            <Typography fontWeight="bold">
              {(dec + decExtra).toFixed(2)}
            </Typography>
            {decExtra > 0 && (
              <Typography fontSize={10}>
                (incl. {decExtra.toFixed(2)})
              </Typography>
            )}
          </>
        )}
      </Box>

      <Image
        src={sps_icon_url}
        alt="SPS"
        width={60}
        height={60}
        style={{ marginTop: 16 }}
      />
      <Typography variant="subtitle2">SPS</Typography>
      {loading ? (
        <Skeleton
          variant="rectangular"
          width={80}
          height={24}
          sx={{ borderRadius: 1 }}
        />
      ) : (
        <Typography fontWeight="bold">{sps.toFixed(2)}</Typography>
      )}
    </Box>
  );
}
