import Image from "next/image";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { Box, Typography } from "@mui/material";

type Props = {
  resource: string;
  width: number;
  height: number;
};

export function PoolIcon({ resource, width, height }: Props) {
  return (
    <Box display={"flex"} flexWrap={"wrap"} alignItems={"center"}>
      <Image
        src={RESOURCE_ICON_MAP["DEC"]}
        alt=""
        width={width}
        height={height}
      />
      <Typography ml={1} mr={1} fontSize={24}>
        -
      </Typography>
      <Image
        src={RESOURCE_ICON_MAP[resource]}
        alt=""
        width={width}
        height={height}
      />
    </Box>
  );
}
