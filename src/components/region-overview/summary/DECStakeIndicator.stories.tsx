import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import DecStakeIndicator from "./DECStakeIndicator";

const meta: Meta<typeof DecStakeIndicator> = {
  title: "Components/Region/DecStakeIndicator",
  component: DecStakeIndicator,
};

export default meta;

type Story = StoryObj<typeof DecStakeIndicator>;

const K = 1_000;

export const Playground: Story = {
  args: {
    title: "DEC Staked (selected)",
    maxPossibleStakedDec: 500 * K,
    totalDecStaked: 240 * K,
    totalDecNeeded: 300 * K,
    totalDecSaved: 40 * K,
    runiStakedDEC: 100 * K,
  },
  render: (args) => (
    <Box width={420}>
      <DecStakeIndicator {...args} />
    </Box>
  ),
};

export const Cases: Story = {
  render: () => (
    <Box display="flex" flexDirection="column" gap={2} width={420}>
      {/* Short of the target: staked bar stops left of the marker */}
      <DecStakeIndicator
        title="Under-staked"
        maxPossibleStakedDec={500 * K}
        totalDecStaked={180 * K}
        totalDecNeeded={300 * K}
        totalDecSaved={40 * K}
        runiStakedDEC={100 * K}
      />

      {/* Staked bar ends exactly on the marker */}
      <DecStakeIndicator
        title="Requirement met"
        maxPossibleStakedDec={500 * K}
        totalDecStaked={300 * K}
        totalDecNeeded={300 * K}
        totalDecSaved={40 * K}
        runiStakedDEC={100 * K}
      />

      {/* Staked bar runs past the marker into the waived segments */}
      <DecStakeIndicator
        title="Over-staked"
        maxPossibleStakedDec={500 * K}
        totalDecStaked={460 * K}
        totalDecNeeded={300 * K}
        totalDecSaved={40 * K}
        runiStakedDEC={100 * K}
      />

      {/* No discounts, no runi: requirement then undeveloped capacity only */}
      <DecStakeIndicator
        title="No discount / no runi"
        maxPossibleStakedDec={500 * K}
        totalDecStaked={200 * K}
        totalDecNeeded={300 * K}
        totalDecSaved={0}
        runiStakedDEC={0}
      />

      {/* Nothing staked yet */}
      <DecStakeIndicator
        title="Empty"
        maxPossibleStakedDec={500 * K}
        totalDecStaked={0}
        totalDecNeeded={500 * K}
        totalDecSaved={0}
        runiStakedDEC={0}
      />

      {/* Fully waived: requirement is 0, all of it covered by discount + runi */}
      <DecStakeIndicator
        title="Fully waived"
        maxPossibleStakedDec={500 * K}
        totalDecStaked={0}
        totalDecNeeded={0}
        totalDecSaved={150 * K}
        runiStakedDEC={200 * K}
      />

      {/* Requirement past the scale: marker turns red */}
      <DecStakeIndicator
        title="Requirement off scale"
        maxPossibleStakedDec={200 * K}
        totalDecStaked={80 * K}
        totalDecNeeded={200 * K}
        totalDecSaved={50 * K}
        runiStakedDEC={50 * K}
      />

      {/* Degenerate max (no deeds) must not render NaN widths */}
      <DecStakeIndicator
        title="Zero max"
        maxPossibleStakedDec={0}
        totalDecStaked={0}
        totalDecNeeded={0}
        totalDecSaved={0}
        runiStakedDEC={0}
      />
    </Box>
  ),
};
