import { formatLargeNumber } from "@/lib/formatters";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import Image from "next/image";
import React from "react";
import { InfoItem } from "./InfoItem";

export const PPInfo: React.FC<{
  basePP: number;
  boostedPP: number;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
}> = ({ basePP, boostedPP, pos }) => {
  return (
    <InfoItem
      icon={
        <Image src={land_hammer_icon_url} alt="hammer" width={25} height={25} />
      }
      title="Total PP"
      text={formatLargeNumber(Number(boostedPP.toFixed(0)))}
      pos={pos}
      tooltip={
        <>
          <strong>Total Production Power (PP):</strong>
          <br />
          Base: {formatLargeNumber(Number(basePP))}
          <br />
          Boosted: {formatLargeNumber(Number(boostedPP))}
        </>
      }
    />
  );
};
