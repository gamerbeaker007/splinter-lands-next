import { ProgressInfo } from "@/types/progressInfo";
import { calculateProgress, timeUntil, validDate } from "../../utils/timeUtils";

export function productionPercentage(hoursSinceLastOp: number): number {
  const maxHours = 7 * 24;
  const percent = (hoursSinceLastOp / maxHours) * 100;
  return Math.min(Math.round(percent * 100) / 100, 100);
}

export function getProgressInfo(
  hoursSinceLastOp: number | null,
  projectCreatedDate: Date | string | null,
  projectedEndDate: Date | string | null,
  boostedPP: number,
): ProgressInfo {
  if (validDate(projectedEndDate)) {
    return {
      percentageDone: calculateProgress(projectCreatedDate, projectedEndDate),
      infoStr: `Finished in: ${timeUntil(projectedEndDate!)}`,
      progressTooltip:
        "Show the amount of time until building is finished. When finished a negative time can be shown.",
    };
  }

  if (boostedPP <= 0) {
    return {
      percentageDone: 0,
      infoStr: "No workers assigned",
      progressTooltip: null,
    };
  }

  if (typeof hoursSinceLastOp === "number") {
    const percentageDone = productionPercentage(hoursSinceLastOp);
    return {
      percentageDone,
      infoStr: `${percentageDone}% Capacity`,
      progressTooltip:
        "How close this plot is to full. Once capacity reached 100%, resources no longer accumulate until they are harvested",
    };
  }

  return {
    percentageDone: 0,
    infoStr: "Undeveloped",
    progressTooltip: null,
  };
}
