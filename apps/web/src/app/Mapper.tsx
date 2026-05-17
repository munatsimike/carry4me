import { META_ICONS } from "./icons/MetaIcon";
export const DEFAULT_VARIANT = "primary" as const;

export const tagToVariant = {
  sender: "primary",
  traveler: "success",
} as const;

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