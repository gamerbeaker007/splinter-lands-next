import { ReactNode } from "react";
import { EnableFilterOptions } from "./filters";

export type Page = {
  key: string;
  label: string;
  component: ReactNode;
  filterOptions?: EnableFilterOptions;
};
