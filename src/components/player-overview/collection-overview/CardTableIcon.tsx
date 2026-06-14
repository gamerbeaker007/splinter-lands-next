import { SpotCardVM } from "@/components/land-manager/production/productionConfigTypes";
import { getCardImgV2 } from "@/lib/utils/cardUtil";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { cardFoilOptions } from "@/types/planner/primitives";
import { Box, Tooltip } from "@mui/material";
import Image from "next/image";

type Props = {
  card: GroupedCardRow | SpotCardVM;
};

export default function CardTableIcon({ card }: Props) {
  const uid = "uid" in card ? card.uid : undefined;
  const img =
    card.name === "Runi"
      ? `https://runi.splinterlands.com/cards/${uid}.jpg`
      : getCardImgV2(card.name, card.edition, cardFoilOptions[card.foil]);

  return (
    <Tooltip
      title={
        <Box width={220} height={300} position="relative">
          <Image
            src={img}
            alt={card.name}
            fill
            sizes="220px"
            style={{
              objectFit: "contain", // Show full card in tooltip
              objectPosition: "center",
              borderRadius: 8,
            }}
          />
        </Box>
      }
      placement="right"
      arrow
    >
      <Box
        width={60}
        height={60}
        position="relative"
        sx={{
          overflow: "hidden",
          background: "#222",
        }}
      >
        <Image
          src={img}
          alt={card.name}
          width={135}
          height={135}
          style={{
            objectFit: "cover",
            objectPosition: "top center",
            marginTop: "-15px",
            marginLeft: "-45px",
          }}
        />
      </Box>
    </Tooltip>
  );
}
