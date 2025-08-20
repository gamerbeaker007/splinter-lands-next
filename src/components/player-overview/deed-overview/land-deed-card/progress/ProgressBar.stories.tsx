// components/BiomeBoosts.stories.tsx
import Box from "@mui/material/Box";
import { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressBar } from "./ProgressBar";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { land_under_construction_icon_url } from "@/lib/shared/statics_icon_urls";
import { timeUntil } from "@/lib/utils/timeUtils";

const meta: Meta<typeof ProgressBar> = {
  title: "Components/PlayerOverview/ProgressBar",
  component: ProgressBar,
};

export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  render: () => {
    const grainIcon = RESOURCE_ICON_MAP["GRAIN"];
    const ironIcon = RESOURCE_ICON_MAP["IRON"];
    const spsIcon = RESOURCE_ICON_MAP["SPS"];
    const underDevelopmentIcon = land_under_construction_icon_url;
    const timeUntilStr = `Finished in: ${timeUntil(new Date("2099-08-20T00:27:27.220Z"))}`;
    return (
      <Box
        display={"flex"}
        flexDirection={"column"}
        border={"1px solid red"}
        width={320}
        gap={2}
        p={2}
      >
        <ProgressBar percentage={0} label={"0"} icon={grainIcon} />
        <ProgressBar percentage={1} label={"1"} icon={grainIcon} />
        <ProgressBar percentage={5} label={"5"} icon={grainIcon} />
        <ProgressBar percentage={10} label={""} icon={ironIcon} />
        <ProgressBar
          percentage={50}
          label={timeUntilStr}
          icon={underDevelopmentIcon}
        />
        <ProgressBar percentage={90} label={"90% Capacity"} icon={spsIcon} />
        <ProgressBar percentage={100} label={"100% Capacity"} icon={spsIcon} />
      </Box>
    );
  },
};
