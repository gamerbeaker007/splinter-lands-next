import { formatNumberWithSuffix } from "@/lib/formatters";
import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { cardFoilOptions, PlotModifiers, SlotInput } from "@/types/planner";
import { LowestMarketData } from "@/types/planner/market/market";
import { SplPriceData } from "@/types/price";
import { SplCardDetails } from "@/types/splCardDetails";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  capitalize,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { IoIosPricetags } from "react-icons/io";
import {
  findLowestCardPrice,
  findLowestDeedPrice,
  findLowestTitlePrice,
  findLowestTotemPrice,
} from "@/lib/frontend/utils/plannerValueCalcs";
import PriceItem from "@/components/planning/planner/output/PriceItem";
import PriceCardItem from "@/components/planning/planner/output/PriceCardItem";

type Props = {
  plot: PlotModifiers;
  cards: SlotInput[];
  cardDetails: SplCardDetails[];
  tokenPriceData: SplPriceData | null;
  marketData: LowestMarketData | null;
};

function calcStakedDECNeeded(cards: SlotInput[]) {
  return cards.reduce((acc, card) => {
    const cardFoilId = cardFoilOptions.indexOf(card.foil);
    const maxBCX = determineCardMaxBCX(card.set, card.rarity, cardFoilId);
    const perBCX = 10_000 / maxBCX;
    return acc + card.bcx * perBCX;
  }, 0);
}

export default function PriceOutput({
  plot,
  cards,
  cardDetails,
  tokenPriceData,
  marketData,
}: Props) {
  const deedResult = marketData
    ? findLowestDeedPrice(plot, marketData.lowestDeedPrices)
    : { price: null, usedKey: null, warning: "No market data." };

  const cardResults = marketData
    ? cards.map((card) =>
        findLowestCardPrice(card, marketData.lowestCardPrices),
      )
    : cards.map(() => ({
        price: null,
        usedKey: null,
        cardInfo: null,
        warning: "No market data.",
      }));

  const totemResult =
    plot.totem !== "none"
      ? marketData
        ? findLowestTotemPrice(plot, marketData.lowestTotemPrices ?? [])
        : { price: null, usedKey: null, warning: "No market data." }
      : { price: null, usedKey: null, warning: null };

  const titleResult =
    plot.title !== "none"
      ? marketData
        ? findLowestTitlePrice(plot, marketData.lowestTitlePrices ?? [])
        : { price: null, usedKey: null, warning: "No market data." }
      : { price: null, usedKey: null, warning: null };

  const cardsTotalUSDPrice = cardResults.reduce((acc, result) => {
    return acc + (result.price ?? 0);
  }, 0);

  const hasWarning =
    deedResult.warning ||
    cardResults.some((r) => r.warning) ||
    totemResult.warning ||
    titleResult.warning;

  const hasRuni = plot.runi != "none";

  const powerCoreDEC = hasRuni ? 0 : 5000;
  const powerCoreinUSD = powerCoreDEC * (tokenPriceData?.dec ?? 0);

  const stakedDECNeeded = calcStakedDECNeeded(cards);
  const stakedDECinUSD = stakedDECNeeded * (tokenPriceData?.dec ?? 0);

  const totalUSD =
    (deedResult.price ?? 0) +
    cardsTotalUSDPrice +
    (totemResult.price ?? 0) +
    (titleResult.price ?? 0) +
    stakedDECinUSD +
    powerCoreinUSD;

  const totalUSDForPurchases =
    (deedResult.price ?? 0) +
    cardsTotalUSDPrice +
    (totemResult.price ?? 0) +
    (titleResult.price ?? 0) +
    powerCoreinUSD;

  const totalDECForPurchases = tokenPriceData
    ? totalUSDForPurchases / (tokenPriceData?.dec ?? 1)
    : null;

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <Box>
      <Box
        mt={1}
        display="flex"
        alignItems="center"
        gap={2}
        onClick={handleDialogOpen}
        sx={{
          cursor: "pointer",
          border: "1px solid",
          padding: 2,
          borderRadius: 1,
          transition: "box-shadow 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,128,0,0.15)",
            borderColor: "success.main",
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box color={"success.main"}>
            <IoIosPricetags size={20} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Total USD Price:
          </Typography>
          <Typography variant="body1" color="success.main">
            {totalUSD.toLocaleString()} USD
          </Typography>
          {hasWarning && (
            <Tooltip
              title={
                "Fallback price is used for estimation, click here to view more details"
              }
            >
              <WarningAmberIcon
                fontSize="medium"
                sx={{
                  color: "warning.main",
                  verticalAlign: "middle",
                  cursor: "pointer",
                }}
              />
            </Tooltip>
          )}
          {hasRuni && (
            <Tooltip title={"Runi is not taken into price estimation!"}>
              <WarningAmberIcon
                fontSize="medium"
                sx={{
                  color: "error.main",
                  verticalAlign: "middle",
                  cursor: "pointer",
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Dialog for detailed information */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Detailed Price Information</DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            color="warning.main"
            sx={{ whiteSpace: "pre-line" }}
          >
            {`Prices shown are estimates based on the lowest market listings.
For cards, the lowest BCX price is used.
Therefor the exact card you want may not always be available for that price.`}
          </Typography>
          {hasRuni && (
            <Typography
              variant="body1"
              color="warning.main"
              sx={{ whiteSpace: "pre-line" }}
            >
              Runi is not included in these calculations.
            </Typography>
          )}
          <PriceItem
            title={"Total USD Price"}
            price={totalUSD.toLocaleString()}
            currency={"USD"}
          />
          <PriceItem
            title={"Deed Price"}
            price={deedResult.price?.toLocaleString() ?? "N/A"}
            currency={"USD"}
            warning={deedResult.warning}
          />

          <Box mt={1}>
            <Typography variant="body2" color="text.secondary">
              Card Prices (per slot):
            </Typography>
            {cardResults.map((result, idx) => {
              return (
                <PriceCardItem
                  key={idx}
                  cardDetails={cardDetails}
                  price={result.price?.toLocaleString() ?? "N/A"}
                  currency={"USD"}
                  warning={result.warning}
                  cardInfo={result.cardInfo}
                  slotId={idx + 1}
                />
              );
            })}
          </Box>

          {plot.totem != "none" && totemResult.price && (
            <PriceItem
              title={"Totem Price"}
              subTitle={capitalize(totemResult.title)}
              price={totemResult.price.toLocaleString()}
              currency={"USD"}
              warning={totemResult.warning}
            />
          )}
          {plot.title != "none" && titleResult.price && (
            <PriceItem
              title={"Title Price"}
              subTitle={capitalize(titleResult.title)}
              price={titleResult.price.toLocaleString()}
              currency={"USD"}
              warning={titleResult.warning}
            />
          )}

          <PriceItem
            title={"Staked DEC Needed"}
            price={formatNumberWithSuffix(stakedDECNeeded)}
            currency={"DEC"}
          />

          <PriceItem
            title={`DEC For Purchases ${hasRuni ? "" : "(incl. 5K Power Core)"}`}
            price={formatNumberWithSuffix(totalDECForPurchases ?? 0)}
            currency={"DEC"}
          />

          <PriceItem
            title={"Total DEC"}
            price={formatNumberWithSuffix(
              (totalDECForPurchases ?? 0) + (stakedDECNeeded ?? 0),
            )}
            currency={"DEC"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
