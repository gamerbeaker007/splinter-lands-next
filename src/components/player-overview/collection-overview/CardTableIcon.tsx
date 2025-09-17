import { getCardImg } from "@/lib/utils/cardUtil";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { Box, Tooltip } from "@mui/material";
import Image from "next/image";

type Props = {
  card: GroupedCardRow;
};

export default function CardTableIcon({ card }: Props) {
  const img = getCardImg(card.name, card.edition, card.foil, card.level);

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
