import type { Location } from "@/types/Ui";
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
