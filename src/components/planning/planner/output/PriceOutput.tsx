import { formatNumberWithSuffix } from "@/lib/formatters";
import {
  determineCardMaxBCX,
  findEditionByCardName,
  getCardImgV2,
} from "@/lib/utils/cardUtil";
import {
  CardFoil,
  cardFoilOptions,
  PlotModifiers,
  SlotInput,
} from "@/types/planner";
import {
  LowestCardPriceEntry,
  LowestDeedPriceEntry,
  LowestMarketData,
  LowestTitlePriceEntry,
  LowestTotemPriceEntry,
} from "@/types/planner/market/market";
import { SplPriceData } from "@/types/price";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, capitalize, Tooltip, Typography } from "@mui/material";

type Props = {
  plot: PlotModifiers;
  cards: SlotInput[];
  cardDetails: SplCardDetails[];
  tokenPriceData: SplPriceData | null;
  marketData: LowestMarketData | null;
};

// Helper to format fallback warning with dropped keys
function formatFallbackWarning(preferredKeys: string[], usedKeys: string[]) {
  const dropped = preferredKeys.filter(
    (k, i) => usedKeys[i] === undefined || usedKeys[i] === "",
  );
  if (dropped.length === 0) return null;
  return `Fallback used for price. Dropped keys: ${dropped.join(", ")}. Used: ${usedKeys
    .filter(Boolean)
    .join(" | ")}`;
}

// Helper to find the best match for deed price with fallback
function findLowestDeedPrice(
  plot: PlotModifiers,
  deedPrices: LowestDeedPriceEntry[],
) {
  if (!deedPrices || deedPrices.length === 0)
    return { price: null, usedKey: null, warning: "No market data." };

  const preferredKeys = ["rarity", "status", "deedType"];
  const keys = [
    {
      rarity: plot.plotRarity,
      status: plot.plotStatus,
      deedType: plot.deedType,
    },
    { rarity: plot.plotRarity, status: plot.plotStatus },
    { rarity: plot.plotRarity, deedType: plot.deedType },
    { status: plot.plotStatus, deedType: plot.deedType },
    { rarity: plot.plotRarity },
    { status: plot.plotStatus },
    { deedType: plot.deedType },
  ];

  for (const keyObj of keys) {
    const match = deedPrices.find((deed) =>
      Object.entries(keyObj).every(
        ([k, v]) => deed[k as keyof LowestDeedPriceEntry] === v,
      ),
    );
    if (match) {
      const usedKeyArr = preferredKeys.map(
        (k) => (keyObj as Record<string, string>)[k],
      );
      const warning =
        usedKeyArr.every((v) => v) === true
          ? null
          : formatFallbackWarning(preferredKeys, usedKeyArr);
      return {
        price: match.listing_price,
        usedKey: usedKeyArr.filter(Boolean).join("|"),
        warning,
      };
    }
  }
  return {
    price: null,
    usedKey: null,
    warning: "No matching plot price found.",
  };
}

function findLowestCardPrice(
  card: SlotInput,
  cardPrices: LowestCardPriceEntry[],
) {
  if (!cardPrices || cardPrices.length === 0)
    return {
      price: null,
      usedKey: null,
      cardDetails: null,
      warning: "No market data.",
    };

  const preferredKeys = ["rarity", "element", "foil", "set"];
  const keys = [
    {
      rarity: card.rarity,
      element: card.element,
      foil: card.foil,
      set: card.set,
    },
    { rarity: card.rarity, element: card.element, foil: card.foil },
    { rarity: card.rarity, element: card.element },
    { rarity: card.rarity, foil: card.foil, set: card.set },
    { rarity: card.rarity, foil: card.foil },
    { rarity: card.rarity, set: card.set },
    { rarity: card.rarity },
  ];

  for (const keyObj of keys) {
    const match = cardPrices.find((cardEntry) =>
      Object.entries(keyObj).every(
        ([k, v]) => cardEntry[k as keyof LowestCardPriceEntry] === v,
      ),
    );
    if (match) {
      const usedKeyArr = preferredKeys.map(
        (k) => (keyObj as Record<string, string>)[k],
      );
      const warning =
        usedKeyArr.every((v) => v) === true
          ? null
          : formatFallbackWarning(preferredKeys, usedKeyArr);
      return {
        price: match.low_price_bcx * card.bcx,
        cardDetails: {
          id: match.card_detail_id,
          bcx: card.bcx,
          rarity: match.rarity,
          element: match.element,
          foil: match.foil,
          set: match.set,
          name: match.name,
        },
        usedKey: usedKeyArr.filter(Boolean).join("|"),
        warning,
      };
    }
  }
  return {
    price: null,
    cardDetail: null,
    usedKey: null,
    warning: "No matching card price found.",
  };
}

function findLowestTotemPrice(
  plot: PlotModifiers,
  totemPrices: LowestTotemPriceEntry[],
) {
  if (!totemPrices || totemPrices.length === 0)
    return { price: null, usedKey: null, warning: "No market data." };

  const match = totemPrices.find((totem) => totem.rarity === plot.totem);
  if (match) {
    return {
      price: match.listing_price,
      title: match.rarity,
      usedKey: match.rarity,
      warning: null,
    };
  }
  return {
    price: null,
    title: null,
    usedKey: null,
    warning: "No matching totem price found.",
  };
}

function findLowestTitlePrice(
  plot: PlotModifiers,
  titlePrices: LowestTitlePriceEntry[],
) {
  if (!titlePrices || titlePrices.length === 0)
    return { price: null, usedKey: null, warning: "No market data." };

  const match = titlePrices.find((title) => title.rarity === plot.title);
  if (match) {
    return {
      price: match.listing_price,
      title: match.titleName,
      usedKey: match.rarity,
      warning: null,
    };
  }
  return {
    price: null,
    usedKey: null,
    title: null,
    warning: "No matching title price found.",
  };
}

function calcStakedDECneeded(cards: SlotInput[]) {
  return cards.reduce((acc, card) => {
    const cardFoilId = cardFoilOptions.indexOf(card.foil);
    const maxBCX = determineCardMaxBCX(card.set, card.rarity, cardFoilId);
    const perBCX = 50_000 / maxBCX;
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
        cardDetails: null,
        warning: "No market data.",
      }));

  const totemResult = marketData
    ? findLowestTotemPrice(plot, marketData.lowestTotemPrices ?? [])
    : { price: null, usedKey: null, warning: "No market data." };

  const titleResult = marketData
    ? findLowestTitlePrice(plot, marketData.lowestTitlePrices ?? [])
    : { price: null, usedKey: null, warning: "No market data." };

  const cardsTotalUSDPrice = cardResults.reduce((acc, result) => {
    return acc + (result.price ?? 0);
  }, 0);

  const stakedDECNeeded = calcStakedDECneeded(cards);
  const stakedDECinUSD = stakedDECNeeded * (tokenPriceData?.dec ?? 0);

  const totalUSD =
    (deedResult.price ?? 0) +
    cardsTotalUSDPrice +
    (totemResult.price ?? 0) +
    (titleResult.price ?? 0) +
    stakedDECinUSD;

  console.log("Total USD:", totalUSD);

  const totalUSDForPurchases =
    (deedResult.price ?? 0) +
    cardsTotalUSDPrice +
    (totemResult.price ?? 0) +
    (titleResult.price ?? 0);
  const totalDECForPurchases = tokenPriceData
    ? totalUSDForPurchases / (tokenPriceData?.dec ?? 1)
    : null;

  console.log("Total DEC for Purchases:", totalDECForPurchases);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Market Prices
      </Typography>
      <Box>
        {!marketData && (
          <Tooltip title="No market data available. Prices may be outdated or missing.">
            <Typography variant="caption" color="warning.main">
              Market data unavailable.
            </Typography>
          </Tooltip>
        )}

        <Typography variant="body2" color="text.secondary">
          Deed Price:
        </Typography>
        <Typography
          variant="body1"
          color={deedResult.price ? "success.main" : "text.disabled"}
        >
          {deedResult.price
            ? `${deedResult.price.toLocaleString()} USD`
            : "N/A"}
        </Typography>
        {deedResult.warning && (
          <Tooltip title={deedResult.warning}>
            <Typography variant="caption" color="warning.main">
              {deedResult.warning}
            </Typography>
          </Tooltip>
        )}
      </Box>
      <Box mt={1}>
        <Typography variant="body2" color="text.secondary">
          Card Prices (per slot):
        </Typography>
        {cardResults.map((result, idx) => {
          // const editionNumber = editionIdByName[ as EditionName] || 0;
          // const foilNumber = ;

          const editionName = findEditionByCardName(
            cardDetails,
            result.cardDetails?.name || "Unknown",
          );

          const image = getCardImgV2(
            result.cardDetails?.name || "Unknown",
            editionName,
            result.cardDetails?.foil as CardFoil,
          );
          return (
            <Box key={idx} display="flex" alignItems="center" gap={1}>
              <Box
                component="img"
                src={image}
                alt={result.cardDetails?.name || "Card Image"}
                sx={{ width: 40, height: 56, borderRadius: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Slot {idx + 1}:
              </Typography>
              <Typography
                variant="body1"
                color={result.price ? "success.main" : "text.disabled"}
              >
                {result.price ? `${result.price.toLocaleString()} USD` : "N/A"}
              </Typography>
              <Typography variant="body1" color={"secondary"}>
                {result.cardDetails?.name
                  ? `${result.cardDetails?.name}`
                  : "N/A"}
              </Typography>
              {result.warning && (
                <Tooltip title={result.warning}>
                  <Typography variant="caption" color="warning.main">
                    {result.warning}
                  </Typography>
                </Tooltip>
              )}
            </Box>
          );
        })}
      </Box>

      {plot.totem != "none" && (
        <Box mt={1}>
          <Typography variant="body2" color="text.secondary">
            Totem Price:
          </Typography>
          {totemResult.price ? (
            <Box>
              <Typography variant="body1" color="success.main">
                {totemResult.price.toLocaleString()} USD
              </Typography>
              <Typography variant="body1" color="secondary">
                {capitalize(totemResult.title.toLocaleString())}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" color="text.disabled">
              N/A
            </Typography>
          )}
          {totemResult.warning && (
            <Tooltip title={totemResult.warning}>
              <Typography variant="caption" color="warning.main">
                {totemResult.warning}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )}
      {plot.title != "none" && (
        <Box mt={1}>
          <Typography variant="body2" color="text.secondary">
            Title Price:
          </Typography>
          {titleResult.price ? (
            <Box>
              <Typography variant="body1" color="success.main">
                {titleResult.price.toLocaleString()} USD
              </Typography>
              <Typography variant="body1" color="secondary">
                {titleResult.title.toLocaleString()}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" color="text.disabled">
              N/A
            </Typography>
          )}
          {titleResult.warning && (
            <Tooltip title={titleResult.warning}>
              <Typography variant="caption" color="warning.main">
                {titleResult.warning}
              </Typography>
            </Tooltip>
          )}
        </Box>
      )}
      <Box mt={1}>
        <Typography variant="body2" color="text.secondary">
          Total USD Price:
        </Typography>
        <Box>
          <Typography variant="body1" color="success.main">
            {totalUSD.toLocaleString()} USD
          </Typography>
        </Box>
      </Box>

      <Box mt={1}>
        <Typography variant="body2" color="text.secondary">
          Total STAKED DEC NEEDED:
        </Typography>
        <Box>
          <Typography variant="body1" color="success.main">
            {formatNumberWithSuffix(stakedDECNeeded)} DEC
          </Typography>
        </Box>
      </Box>
      <Box mt={1}>
        <Typography variant="body2" color="text.secondary">
          Total DEC for Purchases:
        </Typography>
        <Box>
          <Typography variant="body1" color="success.main">
            {formatNumberWithSuffix(totalDECForPurchases ?? 0)} DEC
          </Typography>
        </Box>
      </Box>
      <Box mt={1}>
        <Typography variant="body2" color="text.secondary">
          Total DEC:
        </Typography>
        <Box>
          <Typography variant="body1" color="success.main">
            {formatNumberWithSuffix(
              (totalDECForPurchases ?? 0) + (stakedDECNeeded ?? 0),
            )}
            DEC
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
