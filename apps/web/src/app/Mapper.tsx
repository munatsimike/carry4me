import type { Location } from "@/types/Ui";
import { META_ICONS } from "./icons/MetaIcon";
export const DEFAULT_VARIANT = "primary" as const;

export const tagToVariant = {
  sender: "primary",
  traveler: "success",
} as const;

export const countryToCurrency: Record<Location, string> = {
  UK: "£",
  USA: "$",
  Zimbabwe: "$",
};


export function toflag(country: string) {
  switch (country) {
    case "UK":
      return META_ICONS.ukFlag;
    case "USA":
      return META_ICONS.uSFlagIcon;
    case "Zimbabwe":
      return META_ICONS.zimFlag;
    default:
      return null;
  }
}