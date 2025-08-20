import type { Meta, StoryObj } from "@storybook/nextjs";
import NavTabs from "./NavTabs";
import { Page } from "@/types/Page";
import { useState } from "react";
import { Box } from "@mui/material";

const meta: Meta<typeof NavTabs> = {
  title: "Components/Tabs",
  component: NavTabs,
};

export default meta;

type Story = StoryObj<typeof NavTabs>;

const pages: Page[] = [
  { key: "tst1", label: "Test 1", component: <div>Test 1</div> },
  { key: "tst2", label: "Test 2", component: <div>Test 2</div> },
  { key: "tst3", label: "Test 3", component: <div>Test 3</div> },
  { key: "tst4", label: "Test 4", component: <div>Test 4</div> },
  { key: "tst5", label: "Test 5", component: <div>Test 5</div> },
  { key: "tst6", label: "Test 6", component: <div>Test 6</div> },
  { key: "tst7", label: "Test 7", component: <div>Test 7</div> },
  { key: "tst8", label: "Test 8", component: <div>Test 8</div> },
  { key: "tst9", label: "Test 9", component: <div>Test 9</div> },
  { key: "tst10", label: "Test 10", component: <div>Test 10</div> },
  { key: "tst11", label: "Test 11", component: <div>Test 11</div> },
  { key: "tst12", label: "Test 12", component: <div>Test 12</div> },
  { key: "tst13", label: "Test 13", component: <div>Test 13</div> },
  { key: "tst14", label: "Test 14", component: <div>Test 14</div> },
  { key: "tst15", label: "Test 15", component: <div>Test 15</div> },
  { key: "tst16", label: "Test 16", component: <div>Test 16</div> },
  { key: "tst17", label: "Test 17", component: <div>Test 17</div> },
  { key: "tst18", label: "Test 18", component: <div>Test 18</div> },
  { key: "tst19", label: "Test 19", component: <div>Test 19</div> },
];

export const Default: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<number>(0);

    return (
      <>
        <NavTabs
          pages={pages}
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        />
        <Box mt={4}>{pages[activeTab].component}</Box>
      </>
    );
  },
};
