import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";

export const getElementIconUrl = (element: string) => {
  return land_default_element_icon_url_placeholder.replace(
    "__NAME__",
    element.toLowerCase()
  );
};
