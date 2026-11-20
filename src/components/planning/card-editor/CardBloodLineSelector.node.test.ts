import { createElement, Children, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  options: [] as string[],
  selectProps: null as { value: string; children: React.ReactNode } | null,
}));

vi.mock("@/hooks/useCardBloodlineOptions", () => ({
  useCardBloodlineOptions: () => mocks.options,
}));

vi.mock("@mui/material", async (importOriginal) => {
  const original = await importOriginal<typeof import("@mui/material")>();
  return {
    ...original,
    Tooltip: ({ children }: { children: React.ReactNode }) => children,
    Select: (props: { value: string; children: React.ReactNode }) => {
      mocks.selectProps = props;
      return null;
    },
  };
});

import { CardBloodLineSelector } from "./CardBloodLineSelector";

function renderSelector(value: string) {
  renderToStaticMarkup(
    createElement(CardBloodLineSelector, { value, onChange: () => {} })
  );
  const props = mocks.selectProps;
  if (!props) throw new Error("Select was not rendered");
  return {
    value: props.value,
    options: Children.toArray(props.children)
      .filter(isValidElement<{ value: string }>)
      .map((child) => child.props.value),
  };
}

describe("CardBloodLineSelector", () => {
  beforeEach(() => {
    mocks.options = [];
    mocks.selectProps = null;
  });

  it("keeps the selected bloodline available while options load", () => {
    expect(renderSelector("Avian")).toEqual({
      value: "Avian",
      options: ["Avian"],
    });
  });

  it("does not duplicate the selected bloodline when options arrive", () => {
    mocks.options = ["Avian", "Beast"];
    expect(renderSelector("Avian")).toEqual({
      value: "Avian",
      options: ["Avian", "Beast"],
    });
  });

  it("preserves an imported bloodline missing from the available options", () => {
    mocks.options = ["Avian"];
    expect(renderSelector("Unknown")).toEqual({
      value: "Unknown",
      options: ["Unknown", "Avian"],
    });
  });
});
