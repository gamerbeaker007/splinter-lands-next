import React from "react";
import TotalsDEC from "./TotalDEC";

type Props = {
  totalDec: number;
};

const explanation = `
The total DEC is calculated per region by summing all hourly rewards. From this, a 10% tax is deducted on produced resources.
Next, the cost of producing these resources is subtracted to determine the net total per resource.

If any resource has a negative net value, a 10% transfer fee is added to simulate importing that resource from another region.

Finally, all net values across all resources and regions are combined.
Remaining positive or negative balances are converted to DEC based on the current price (cached hourly).
`;

const ProductionTotalsDEC: React.FC<Props> = ({ totalDec }) => {
  return (
    <TotalsDEC
      title={"Production Net DEC"}
      dec={Number(totalDec)}
      explanation={explanation}
    />
  );
};

export default ProductionTotalsDEC;
