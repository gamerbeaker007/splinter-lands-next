import { RESOURCE_PRESETS } from "@/constants/conversion/presets";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useResourceConversion } from "./userResourceConversion";

describe("resource conversion selection", () => {
  it("excludes deselected amounts from DEC and SPS totals", () => {
    function Probe() {
      const { dec_total, sps_amount } = useResourceConversion(
        "buy",
        { ...RESOURCE_PRESETS.clear.input, WOOD: 2, IRON: 100 },
        ["WOOD"],
        0,
        { WOOD: 9, IRON: 10, SPS: 2 }
      );
      return createElement("span", null, `${dec_total}:${sps_amount}`);
    }
    expect(renderToStaticMarkup(createElement(Probe))).toContain("20:10");
  });
});
