import { ReactNode } from "react";
import { EnableFilterOptions } from "./filters";

export type Page = {
  label: string;
  component: ReactNode;
  filterOptions?: EnableFilterOptions;
};
