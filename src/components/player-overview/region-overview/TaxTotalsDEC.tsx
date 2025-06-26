import { RegionTaxSummary } from "@/types/resource";
import React from "react";
import TotalsDEC from "./TotalDEC";

type Props = {
  taxData: RegionTaxSummary[] | null;
};

const explanation = `Taxes are calculated daily using cached data.

If a player owns a Keep, it fetches all resource rewards from the specific tract and region.
If the player owns a Castle, it fetches rewards for the entire region.

For each resource, a 10% tax is applied to the hourly rewards. Then, based on the Keep or Castle's capture rate, the player's share is determined.

The taxed resources are then converted to DEC based on current values, and the totals are summarized across all regions.`;

const TaxTotalsDEC: React.FC<Props> = ({ taxData }) => {
  const totalDec = taxData
    ? taxData.reduce((sum, entry) => {
        const resourceSum = entry.resources.reduce((acc, res) => {
          const decKeys = Object.keys(res).filter((key) =>
            key.startsWith("dec"),
          );
          const decSum = decKeys.reduce(
            (subAcc, key) => subAcc + Number(res[key] || 0),
            0,
          );
          return acc + decSum;
        }, 0);
        return sum + resourceSum;
      }, 0)
    : 0;

  return (
    <TotalsDEC
      title={"Tax Income Net DEC"}
      dec={Number(totalDec)}
      explanation={explanation}
    />
  );
};

export default TaxTotalsDEC;
