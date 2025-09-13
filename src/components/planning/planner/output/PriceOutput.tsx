import { Box, Typography, Tooltip } from "@mui/material";
import { PlotModifiers, SlotInput } from "@/types/planner";
import {
  LowestMarketData,
  LowestCardPriceEntry,
  LowestDeedPriceEntry,
} from "@/types/planner/market/market";

type Props = {
  plot: PlotModifiers;
  cards: SlotInput[];
  marketData: LowestMarketData | null;
};

// Helper to find the best match for deed price with fallback
function findLowestDeedPrice(
  plot: PlotModifiers,
  deedPrices: LowestDeedPriceEntry[],
) {
  if (!deedPrices || deedPrices.length === 0)
    return { price: null, usedKey: null, warning: "No market data." };

  const keys = [
    {
      rarity: plot.plotRarity,
      status: plot.plotStatus,
      deedType: plot.deedType,
    },
    { rarity: plot.plotRarity, status: plot.plotStatus },
    { rarity: plot.plotRarity, terrain: plot.deedType },
    { status: plot.plotStatus, terrain: plot.deedType },
    { rarity: plot.plotRarity },
    { status: plot.plotStatus },
    { terrain: plot.deedType },
  ];

  for (const keyObj of keys) {
    const match = deedPrices.find((deed) =>
      Object.entries(keyObj).every(
        ([k, v]) => deed[k as keyof LowestDeedPriceEntry] === v,
      ),
    );
    if (match) {
      const usedKey = Object.values(keyObj).join("|");
      const warning =
        usedKey === `${plot.plotRarity}|${plot.plotStatus}|${plot.deedType}`
          ? null
          : `Fallback used for plot price: ${usedKey}`;
      return { price: match.listing_price, usedKey, warning };
    }
  }
  return {
    price: null,
    usedKey: null,
    warning: "No matching plot price found.",
  };
}

// Helper to find the best match for card price with fallback
function findLowestCardPrice(
  card: SlotInput,
  cardPrices: LowestCardPriceEntry[],
) {
  if (!cardPrices || cardPrices.length === 0)
    return { price: null, usedKey: null, warning: "No market data." };

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
      const usedKey = Object.values(keyObj).join("|");
      const warning =
        usedKey === `${card.rarity}|${card.element}|${card.foil}|${card.set}`
          ? null
          : `Fallback used for card price: ${usedKey}`;
      return { price: match.low_price_bcx * card.bcx, usedKey, warning };
    }
  }
  return {
    price: null,
    usedKey: null,
    warning: "No matching card price found.",
  };
}

export default function PriceOutput({ plot, cards, marketData }: Props) {
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
        warning: "No market data.",
      }));

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        Market Prices
      </Typography>
      <Box>
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
        {cardResults.map((result, idx) => (
          <Box key={idx} display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Slot {idx + 1}:
            </Typography>
            <Typography
              variant="body1"
              color={result.price ? "success.main" : "text.disabled"}
            >
              {result.price ? `${result.price.toLocaleString()} USD` : "N/A"}
            </Typography>
            {result.warning && (
              <Tooltip title={result.warning}>
                <Typography variant="caption" color="warning.main">
                  {result.warning}
                </Typography>
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>
      {!marketData && (
        <Tooltip title="No market data available. Prices may be outdated or missing.">
          <Typography variant="caption" color="warning.main">
            Market data unavailable.
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}
