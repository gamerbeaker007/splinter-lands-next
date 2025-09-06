import { formatLargeNumber } from "@/lib/formatters";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { getCardImg, RarityColor } from "@/lib/utils/cardUtil";
import { Box, Typography } from "@mui/material";
import Image from "next/image";

type Props = {
  name: string;
  rarity: string;
  edition: number;
  foil: number;
  bcx: number;
  count: number;
  base_pp: number;
  uid: string;
};

export default function CardTileSimple({
  name,
  rarity,
  edition,
  foil,
  bcx,
  count,
  base_pp: basePP,
  uid,
}: Props) {
  const isFoil = foil === 1 || foil === 2;

  const img =
    name === "Runi"
      ? `https://runi.splinterlands.com/cards/${uid}.jpg`
      : getCardImg(name, edition, foil);

  return (
    <Box>
      <Box border={"solid 1xp red"} width={85} height={110}>
        <Box
          width={85}
          height={85}
          border={isFoil ? "2px solid gold" : "1px solid gray"}
          overflow="hidden"
          position="relative"
          bgcolor="background.paper"
          borderRadius={"10px 10px 0px 0px"}
        >
          {/* Top cropped card image */}
          <Box height={190} position="relative">
            <Image
              src={img}
              alt={name}
              fill
              sizes="150px"
              style={{
                objectFit: "cover",
                objectPosition: "top center",
                marginTop: "-15px",
              }}
            />
          </Box>

          {/* Top-right BCX info */}
          <Box
            border={"solid 1px white"}
            position="absolute"
            top={5}
            right={4}
            height={20}
            width={50}
            bgcolor="rgba(0,0,0,0.9)"
            color="white"
            fontSize="0.725rem"
            borderRadius={0.5}
            textAlign={"center"}
            fontWeight="bold"
            lineHeight={1.7}
          >
            {bcx} ({count})
          </Box>

          {/* Top-left rarity dot (placeholder logic) */}
          <Box
            position="absolute"
            top={5}
            left={6}
            width={14}
            height={14}
            borderRadius="50%"
            border={1}
            bgcolor={RarityColor[rarity]}
          />
        </Box>

        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent={"center"}
          bgcolor="rgba(70, 71, 70, 0.9)"
          color="white"
          fontSize="0.625rem"
          px={0.6}
          borderRadius={"0px 0px 10px 10px"}
          gap={0.5}
        >
          <Image
            src={land_hammer_icon_url}
            alt="hammer"
            width={15}
            height={15}
          />
          <Typography fontSize="0.9rem">
            {formatLargeNumber(Number(basePP.toFixed(0)))}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
