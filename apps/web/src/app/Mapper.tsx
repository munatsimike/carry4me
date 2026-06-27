import { META_ICONS } from "./icons/MetaIcon";
export const DEFAULT_VARIANT = "primary" as const;

const SUPPORTED_PHONE_COUNTRIES = [
  { countryCode: "UK", dialCode: "+44", name: "United Kingdom" },
  { countryCode: "USA", dialCode: "+1", name: "United States of America" },
  { countryCode: "NL", dialCode: "+31", name: "Netherlands" },
  { countryCode: "FR", dialCode: "+33", name: "France" },
  { countryCode: "Zimbabwe", dialCode: "+263", name: "Zimbabwe" },
] as const;

const DIAL_CODES_LONGEST_FIRST = [...SUPPORTED_PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

/** Used when a country exists in the DB but has no seeded cities yet. */
export const FALLBACK_CITIES_BY_COUNTRY_CODE: Record<string, string[]> = {
  UK: ["London", "Birmingham", "Manchester"],
  USA: ["Houston", "Dallas", "Atlanta"],
  NL: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
  FR: ["Paris", "Lyon", "Marseille", "Mulhouse"],
  France: ["Paris", "Lyon", "Marseille"],
  Zimbabwe: ["Harare", "Bulawayo"],
  ZW: ["Harare", "Bulawayo"],
};

export const tagToVariant = {
  sender: "primary",
  traveler: "success",
} as const;

export function toflag(country: string | null | undefined) {
  if (!country?.trim()) return null;

  switch (country.trim()) {
    case "UK":
    case "GB":
    case "United Kingdom":
      return META_ICONS.ukFlag;
    case "USA":
    case "US":
    case "United States":
    case "United States of America":
      return META_ICONS.uSFlagIcon;
    case "Zimbabwe":
    case "ZW":
      return META_ICONS.zimFlag;
    case "NL":
    case "Netherlands":
      return META_ICONS.nlFlag;
    case "FR":
    case "France":
      return META_ICONS.frFlag;
    default: {
      const normalized = normalizeCountryCode(country.trim());
      if (!normalized || normalized === country.trim()) return null;
      return toflag(normalized);
    }
  }
}

export function toDialCode(country: string | null | undefined): string | null {
  if (!country?.trim()) return null;

  switch (country.trim()) {
    case "UK":
    case "GB":
    case "United Kingdom":
      return "+44";
    case "USA":
    case "US":
    case "United States":
    case "United States of America":
      return "+1";
    case "Zimbabwe":
    case "ZW":
      return "+263";
    case "NL":
    case "Netherlands":
      return "+31";
    case "FR":
    case "France":
      return "+33";
    default:
      return null;
  }
}

export function toIsoCountryCode(country: string | null | undefined) {
  if (!country?.trim()) return null;

  switch (country.trim()) {
    case "UK":
    case "GB":
    case "United Kingdom":
      return "GB";
    case "USA":
    case "US":
    case "United States":
    case "United States of America":
      return "US";
    case "Zimbabwe":
    case "ZW":
      return "ZW";
    case "NL":
    case "Netherlands":
      return "NL";
    case "FR":
    case "France":
      return "FR";
    default:
      return null;
  }
}

export function toCountryName(
  country: string | null | undefined,
): string | null {
  if (!country?.trim()) return null;

  switch (country.trim()) {
    case "UK":
    case "GB":
    case "United Kingdom":
      return "United Kingdom";
    case "USA":
    case "US":
    case "United States":
    case "United States of America":
      return "United States of America";
    case "Zimbabwe":
    case "ZW":
      return "Zimbabwe";
    case "NL":
    case "Netherlands":
      return "Netherlands";
    case "FR":
    case "France":
      return "France";
    default:
      return null;
  }
}

/** Maps profile DB values, ISO codes, and display names to app country codes. */
export function normalizeCountryCode(
  country: string | null | undefined,
): string | null {
  if (!country?.trim()) return null;

  const value = country.trim();

  if (toCountryName(value)) return value;

  switch (value) {
    case "GB":
      return "UK";
    case "US":
      return "USA";
    case "United Kingdom":
      return "UK";
    case "United States":
    case "United States of America":
      return "USA";
    case "Netherlands":
      return "NL";
    case "France":
      return "FR";
    case "Zimbabwe":
      return "ZW";
    case "ZW":
      return "ZW";
    default:
      return value;
  }
}

/** Reads the international dial prefix from a phone number (e.g. +44, +31, +1). */
export function dialCodeFromPhone(
  phoneNumber: string | null | undefined,
): string | null {
  if (!phoneNumber?.trim()) return null;

  const digits = phoneNumber.replace(/\D/g, "");
  if (!digits) return null;

  const e164 = `+${digits}`;

  for (const { dialCode } of DIAL_CODES_LONGEST_FIRST) {
    if (e164.startsWith(dialCode)) return dialCode;
  }

  return null;
}

/** Maps a dial code to the app country code (e.g. +44 → UK, +31 → NL). */
export function countryCodeFromDialCode(
  dialCode: string | null | undefined,
): string | null {
  if (!dialCode) return null;
  return (
    SUPPORTED_PHONE_COUNTRIES.find((entry) => entry.dialCode === dialCode)
      ?.countryCode ?? null
  );
}

/** Derives the app country code from the phone number's dial prefix. */
export function countryCodeFromPhone(
  phoneNumber: string | null | undefined,
): string | null {
  return countryCodeFromDialCode(dialCodeFromPhone(phoneNumber));
}

/** Derives the display country name from a phone number's dial prefix. */
export function countryNameFromPhone(
  phoneNumber: string | null | undefined,
): string | null {
  const countryCode = countryCodeFromPhone(phoneNumber);
  if (!countryCode) return null;
  return toCountryName(countryCode) ?? countryCode;
}

/** Location label for forms: dial code + country name (e.g. +44 United Kingdom). */
export function countryLocationFromPhone(
  phoneNumber: string | null | undefined,
): string | null {
  const dialCode = dialCodeFromPhone(phoneNumber);
  const name = countryNameFromPhone(phoneNumber);
  if (!dialCode || !name) return null;
  return `${dialCode} ${name}`;
}
