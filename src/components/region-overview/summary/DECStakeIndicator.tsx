import { formatCompactNumber } from "@/lib/formatters";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import React from "react";

type Props = {
  title: string;

  /**
   * Theoretical maximum DEC requirement.
   * E.g. max worker slots * 10K DEC.
   */
  maxPossibleStakedDec: number;

  /** DEC actually staked by the player. */
  totalDecStaked: number;

  /**
   * Actual DEC requirement after discounts and Runi reductions.
   */
  totalDecNeeded: number;

  /** DEC requirement removed by discount abilities. */
  totalDecSaved: number;

  /** DEC requirement removed by Runi. */
  runiStakedDEC?: number;
};

const REQUIRED_COLOR = "primary.main";
const SAVED_COLOR = "warning.main";
const RUNI_COLOR = "secondary.main";
const UNUSED_COLOR = "action.hover";
const STAKED_COLOR = "primary.main";

const TRACK_HEIGHT = 12;

const DecStakeIndicator: React.FC<Props> = ({
  title,
  maxPossibleStakedDec,
  totalDecStaked,
  totalDecNeeded,
  totalDecSaved,
  runiStakedDEC = 0,
}) => {
  const clamp = (value: number) => Math.min(100, Math.max(0, value));

  const toPct = (value: number) =>
    maxPossibleStakedDec > 0 ? clamp((value / maxPossibleStakedDec) * 100) : 0;

  /*
   * Requirement composition:
   *
   * required + discount + runi + unfilledCapacity = theoretical max
   *
   * Actual staking is deliberately NOT part of this equation.
   */
  const grossWorkerRequirement = totalDecNeeded + totalDecSaved + runiStakedDEC;

  const unfilledCapacity = Math.max(
    0,
    maxPossibleStakedDec - grossWorkerRequirement
  );

  const requiredEnd = toPct(totalDecNeeded);
  const savedEnd = toPct(totalDecNeeded + totalDecSaved);
  const runiEnd = toPct(grossWorkerRequirement);

  /*
   * Actual stake is a separate measurement.
   */
  const stakedEnd = toPct(totalDecStaked);

  const delta = totalDecStaked - totalDecNeeded;

  const stakedOverMax = Math.max(0, totalDecStaked - maxPossibleStakedDec);

  const compositionOverMax = Math.max(
    0,
    grossWorkerRequirement - maxPossibleStakedDec
  );

  return (
    <Box
      sx={{
        width: "100%",
        p: 2,
        border: "1px solid",
        borderColor: "secondary.main",
        borderRadius: 3,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>

          <Typography variant="h5" fontWeight={700}>
            {formatCompactNumber(totalDecStaked, { maximumFractionDigits: 2 })}

            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              ml={0.5}
            >
              DEC staked
            </Typography>
          </Typography>
        </Box>

        <Tooltip
          title={
            delta >= 0
              ? `${formatCompactNumber(delta)} DEC staked above the requirement`
              : `${formatCompactNumber(
                  Math.abs(delta)
                )} DEC short of the requirement`
          }
        >
          <Typography
            variant="body2"
            fontWeight={600}
            color={delta >= 0 ? "success.main" : "error.main"}
            sx={{ whiteSpace: "nowrap" }}
          >
            {delta >= 0 ? "▲" : "▼"}{" "}
            {formatCompactNumber(Math.abs(delta), { maximumFractionDigits: 2 })}{" "}
            DEC
          </Typography>
        </Tooltip>
      </Stack>

      {/* ============================================================
          REQUIREMENT COMPOSITION
          ============================================================ */}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={0.5}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Requirement
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {formatCompactNumber(totalDecNeeded, { maximumFractionDigits: 2 })}{" "}
          DEC needed
        </Typography>
      </Stack>

      <Box
        sx={{
          position: "relative",
          height: TRACK_HEIGHT,
          borderRadius: 999,
          bgcolor: UNUSED_COLOR,
          overflow: "hidden",
        }}
      >
        {/* Required */}
        {requiredEnd > 0 && (
          <Tooltip
            title={`${formatCompactNumber(totalDecNeeded)} DEC actually required`}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                width: `${requiredEnd}%`,
                bgcolor: REQUIRED_COLOR,
              }}
            />
          </Tooltip>
        )}

        {/* Discount */}
        {savedEnd > requiredEnd && (
          <Tooltip
            title={`${formatCompactNumber(
              totalDecSaved
            )} DEC saved by discount abilities`}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${requiredEnd}%`,
                width: `${savedEnd - requiredEnd}%`,
                bgcolor: SAVED_COLOR,
              }}
            />
          </Tooltip>
        )}

        {/* Runi */}
        {runiEnd > savedEnd && (
          <Tooltip
            title={`${formatCompactNumber(
              runiStakedDEC
            )} DEC requirement removed by Runi`}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${savedEnd}%`,
                width: `${runiEnd - savedEnd}%`,
                bgcolor: RUNI_COLOR,
              }}
            />
          </Tooltip>
        )}

        {/*
          Everything remaining is unused worker-slot capacity.
          No explicit Box is needed because the track background
          already represents UNUSED_COLOR.
        */}
      </Box>

      {/* Requirement legend */}
      <Stack
        direction="row"
        flexWrap="wrap"
        columnGap={1.5}
        rowGap={0.5}
        mt={0.75}
      >
        <LegendItem
          color={REQUIRED_COLOR}
          label={`Needed ${formatCompactNumber(totalDecNeeded, { maximumFractionDigits: 2 })}`}
        />

        {totalDecSaved > 0 && (
          <LegendItem
            color={SAVED_COLOR}
            label={`Discount ${formatCompactNumber(totalDecSaved, { maximumFractionDigits: 2 })}`}
          />
        )}

        {runiStakedDEC > 0 && (
          <LegendItem
            color={RUNI_COLOR}
            label={`Runi ${formatCompactNumber(runiStakedDEC, { maximumFractionDigits: 2 })}`}
          />
        )}

        {unfilledCapacity > 0 && (
          <LegendItem
            color={UNUSED_COLOR}
            label={`Unfilled Capacity ${formatCompactNumber(unfilledCapacity, { maximumFractionDigits: 2 })}`}
          />
        )}
      </Stack>

      {/* ============================================================
          ACTUAL STAKE
          ============================================================ */}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
        mb={0.5}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Actual stake
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {formatCompactNumber(totalDecStaked, { maximumFractionDigits: 2 })}{" "}
          DEC
        </Typography>
      </Stack>

      <Box
        role="progressbar"
        aria-label={`${title} DEC staked`}
        aria-valuemin={0}
        aria-valuemax={maxPossibleStakedDec}
        aria-valuenow={Math.min(totalDecStaked, maxPossibleStakedDec)}
        aria-valuetext={`${formatCompactNumber(
          totalDecStaked
        )} DEC staked; ${formatCompactNumber(totalDecNeeded)} DEC required`}
        sx={{
          position: "relative",
          height: TRACK_HEIGHT,
          borderRadius: 999,
          bgcolor: "action.hover",
          overflow: "visible",
        }}
      >
        {/* Actual stake */}
        <Tooltip title={`${formatCompactNumber(totalDecStaked)} DEC staked`}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: `${stakedEnd}%`,
              minWidth: stakedEnd > 0 ? 2 : 0,
              bgcolor: STAKED_COLOR,
              borderRadius: 999,
            }}
          />
        </Tooltip>

        {/* Required target */}
        <Tooltip title={`${formatCompactNumber(totalDecNeeded)} DEC required`}>
          <Box
            sx={{
              position: "absolute",
              left: `${requiredEnd}%`,
              top: -4,
              bottom: -4,
              width: 2,
              bgcolor: "text.primary",
              transform: "translateX(-1px)",
              zIndex: 1,
            }}
          />
        </Tooltip>
      </Box>

      {/* Scale */}
      <Stack direction="row" justifyContent="space-between" mt={0.5}>
        <Typography variant="caption" color="text.secondary">
          0
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Max{" "}
          {formatCompactNumber(maxPossibleStakedDec, {
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Stack>

      {/* Stake status */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mt={0.75}
      >
        <Typography variant="caption" color="text.secondary">
          Target{" "}
          {formatCompactNumber(totalDecNeeded, { maximumFractionDigits: 2 })}
        </Typography>

        <Typography
          variant="caption"
          fontWeight={600}
          color={delta >= 0 ? "success.main" : "error.main"}
        >
          {delta >= 0
            ? `${formatCompactNumber(delta, { maximumFractionDigits: 2 })} above target`
            : `${formatCompactNumber(Math.abs(delta), { maximumFractionDigits: 2 })} short`}
        </Typography>
      </Stack>

      {/* Exceptional states */}
      {stakedOverMax > 0 && (
        <Typography
          variant="caption"
          color="warning.main"
          display="block"
          mt={0.5}
        >
          +{formatCompactNumber(stakedOverMax, { maximumFractionDigits: 2 })}{" "}
          DEC staked above theoretical max
        </Typography>
      )}

      {compositionOverMax > 0 && (
        <Typography
          variant="caption"
          color="error.main"
          display="block"
          mt={0.5}
        >
          Requirement composition exceeds theoretical maximum by{" "}
          {formatCompactNumber(compositionOverMax, {
            maximumFractionDigits: 2,
          })}{" "}
          DEC
        </Typography>
      )}
    </Box>
  );
};

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <Stack direction="row" alignItems="center" spacing={0.5}>
    <Box
      sx={{
        width: 8,
        height: 8,
        flexShrink: 0,
        borderRadius: "50%",
        bgcolor: color,
        border: "1px solid",
        borderColor: "divider",
      }}
      aria-hidden
    />

    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Stack>
);

export default DecStakeIndicator;
