import { META_ICONS } from "./icons/MetaIcon";
export const DEFAULT_VARIANT = "primary" as const;

export const tagToVariant = {
  sender: "primary",
  traveler: "success",
} as const;

export function toflag(country: string) {
  switch (country) {
    case "UK":
    case "GB":
      return META_ICONS.ukFlag;
    case "USA":
    case "US":
      return META_ICONS.uSFlagIcon;
    case "Zimbabwe":
    case "ZW":
      return META_ICONS.zimFlag;
    default:
      return null;
  }
}

export function toDialCode(country: string): string | null {
  switch (country) {
    case "UK":
    case "GB":
      return "+44";
    case "USA":
    case "US":
      return "+1";
    case "Zimbabwe":
    case "ZW":
      return "+263";
    default:
      return null;
  }
}

export function toIsoCountryCode(country: string) {
  switch (country) {
    case "UK":
    case "GB":
      return "GB";
    case "USA":
    case "US":
      return "US";
    case "Zimbabwe":
    case "ZW":
      return "ZW";
    default:
      return null;
  }
}
