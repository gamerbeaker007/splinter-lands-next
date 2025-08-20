import { formatLargeNumber } from "@/lib/formatters";
import { CSSSize } from "@/types/cssSize";
import React from "react";
import { FaAngleDoubleUp } from "react-icons/fa";
import { InfoItem } from "./InfoItem";

export const TotalBoostInfo: React.FC<{
  totalBoost: number;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
}> = ({ totalBoost, pos }) => {
  return (
    <InfoItem
      icon={
        <FaAngleDoubleUp
          style={{
            color: "green",
            width: 25,
            height: 25,
            transform: "rotate(45deg)",
          }}
        />
      }
      title="Total Boost"
      text={`${formatLargeNumber(Number((totalBoost * 100).toFixed(0)))}%`}
      pos={pos}
    />
  );
};
