import type { Meta, StoryObj } from "@storybook/nextjs";
import NavTabs from "./NavTabs";
import { Page } from "@/types/Page";

const meta: Meta<typeof NavTabs> = {
  title: "Components/Tabs",
  component: NavTabs,
};

export default meta;

type Story = StoryObj<typeof NavTabs>;

const pages: Page[] = [
  { label: "Test 1", component: <div>Test 1</div> },
  { label: "Test 2", component: <div>Test 2</div> },
  { label: "Test 3", component: <div>Test 3</div> },
  { label: "Test 4", component: <div>Test 4</div> },
  { label: "Test 5", component: <div>Test 5</div> },
  { label: "Test 6", component: <div>Test 6</div> },
  { label: "Test 7", component: <div>Test 7</div> },
  { label: "Test 8", component: <div>Test 8</div> },
  { label: "Test 9", component: <div>Test 9</div> },
  { label: "Test 10", component: <div>Test 10</div> },
  { label: "Test 11", component: <div>Test 11</div> },
  { label: "Test 12", component: <div>Test 12</div> },
  { label: "Test 13", component: <div>Test 13</div> },
  { label: "Test 14", component: <div>Test 14</div> },
  { label: "Test 15", component: <div>Test 15</div> },
  { label: "Test 16", component: <div>Test 16</div> },
  { label: "Test 17", component: <div>Test 17</div> },
  { label: "Test 18", component: <div>Test 18</div> },
  { label: "Test 19", component: <div>Test 19</div> },
];

export const Default: Story = {
  render: () => {
    return <NavTabs pages={pages} />;
  },
};
