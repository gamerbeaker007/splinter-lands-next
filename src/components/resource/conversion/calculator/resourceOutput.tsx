import { dec_icon_url, sps_icon_url } from "@/lib/shared/statics_icon_urls";
import InfoIcon from "@mui/icons-material/Info";
import { Box, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

type Props = {
  dec: number;
  sps: number;
  decExtra: number;
  loading?: boolean;
};

const IMAGE_SIZE = 60;

export function ResourceOutput({ dec, sps, decExtra, loading = false }: Props) {
  return (
    <Stack display="flex" flexDirection="row" flexWrap="wrap" gap={2}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
        minWidth={100}
      >
        <Image
          src={dec_icon_url}
          alt="DEC"
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
        />
        <Typography variant="subtitle2">DEC</Typography>
        {loading ? (
          <Skeleton variant="rectangular" width={80} height={24} />
        ) : (
          <Stack direction="row" spacing={0.5} alignItems={"center"}>
            <Typography fontWeight="bold">
              {(dec + decExtra).toFixed(3)}
            </Typography>
            {decExtra > 0 && (
              <Tooltip
                title={`Includes fixed cost of ${decExtra.toFixed(2)} DEC`}
                arrow
              >
                <InfoIcon sx={{ fontSize: 16 }} />
              </Tooltip>
            )}
          </Stack>
        )}
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
        minWidth={100}
      >
        <Image
          src={sps_icon_url}
          alt="SPS"
          width={IMAGE_SIZE}
          height={IMAGE_SIZE}
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
    </Stack>
  );
}
