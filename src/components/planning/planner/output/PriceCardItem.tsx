import { findCardEditionNameByName, getCardImgV2 } from "@/lib/utils/cardUtil";
import {
  CardElement,
  CardFoil,
  CardRarity,
  CardSetName,
} from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

type Props = {
  cardDetails: SplCardDetails[];
  slotId: number;
  price: string;
  currency: string;
  cardInfo?: {
    id: number;
    bcx: number;
    rarity: CardRarity;
    element: CardElement;
    foil: CardFoil;
    set: CardSetName;
    name: string;
  } | null;
  warning: string | null;
};

export default function PriceCardItem({
  cardDetails,
  slotId,
  price,
  currency,
  cardInfo,
  warning,
}: Props) {
  const editionName = findCardEditionNameByName(
    cardDetails,
    cardInfo?.name || "Unknown",
    cardInfo?.set || "chaos",
  );

  const image = getCardImgV2(
    cardInfo?.name || "Unknown",
    editionName,
    cardInfo?.foil as CardFoil,
  );

  return (
    <Box mt={2}>
      <Box display="flex" alignItems="center">
        <Box
          mr={1}
          sx={{
            position: "relative",
            width: 70, // small box width
            height: 70, // small box height (card-like ratio)
            borderRadius: 1,
            overflow: "hidden",
            flexShrink: 0, // prevents shrinking in flex row
          }}
        >
          <Tooltip
            title={
              <Box width={220} height={300} position="relative">
                <Image
                  src={image}
                  alt={cardInfo?.name ?? "Unknown"}
                  fill
                  sizes="220px"
                  style={{
                    objectFit: "contain", // Show full card in tooltip
                    objectPosition: "center",
                  }}
                />
              </Box>
            }
            placement="right"
            arrow
          >
            <Box
              width={70}
              height={70}
              position="relative"
              sx={{
                overflow: "hidden",
                background: "#222",
              }}
            >
              <Image
                src={image}
                alt={cardInfo?.name ?? "Unknown"}
                width={135}
                height={135}
                style={{
                  objectFit: "cover",
                  objectPosition: "top center",
                  marginTop: "-25px",
                  marginLeft: "-40px",
                }}
              />
            </Box>
          </Tooltip>
        </Box>

        <Typography variant="body2" color="text.secondary" mr={1}>
          Slot {slotId}:
        </Typography>
        <Typography
          variant="body1"
          color={price ? "success.main" : "text.disabled"}
          mr={2}
        >
          {price ? `${price} ${currency}` : "N/A"}
        </Typography>
        <Typography variant="body1" color={"secondary"}>
          {cardInfo?.name ? `${cardInfo?.name}` : "N/A"}
        </Typography>
      </Box>

      {warning && (
        <Tooltip title={warning}>
          <Typography variant="caption" color="warning.main">
            {warning}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}
