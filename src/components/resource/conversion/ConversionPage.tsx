"use client";

import { ResourceCalculator } from "./calculator/ResourceCalculator";
import { ResourceFactorSection } from "./factor/ResourceFactorSection";

export function ConversionPage() {
  return (
    <>
      <ResourceCalculator />
      <ResourceFactorSection />
    </>
  );
}
