import { META_ICONS } from "./icons/MetaIcon";
export const DEFAULT_VARIANT = "primary" as const;

const SUPPORTED_PHONE_COUNTRIES = [
  { countryCode: "UK", dialCode: "+44", name: "United Kingdom" },
  { countryCode: "USA", dialCode: "+1", name: "United States of America" },
  { countryCode: "IE", dialCode: "+353", name: "Ireland" },
  { countryCode: "NL", dialCode: "+31", name: "Netherlands" },
  { countryCode: "FR", dialCode: "+33", name: "France" },
  { countryCode: "JP", dialCode: "+81", name: "Japan" },
  { countryCode: "ZW", dialCode: "+263", name: "Zimbabwe" },
] as const;

const DIAL_CODES_LONGEST_FIRST = [...SUPPORTED_PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

/** Used when a country exists in the DB but has no seeded cities yet. */
export const FALLBACK_CITIES_BY_COUNTRY_CODE: Record<string, string[]> = {
  UK: ["London", "Birmingham", "Manchester"],
  USA: ["Houston", "Dallas", "Atlanta", "Arizona"],
  IE: ["Dublin", "Cork", "Galway"],
  Ireland: ["Dublin", "Cork", "Galway"],
  NL: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
  FR: ["Paris", "Lyon", "Marseille", "Mulhouse"],
  France: ["Paris", "Lyon", "Marseille"],
  JP: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Fukuoka"],
  Japan: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Fukuoka"],
  Zimbabwe: ["Harare", "Mutare", "Bulawayo", "Gweru", "Masvingo"],
  ZW: ["Harare", "Mutare", "Bulawayo", "Gweru", "Masvingo"],
};

export const tagToVariant = {
  sender: "primary",
  traveler: "success",
} as const;

function phoneCountryEntry(country: string | null | undefined) {
  const normalized = normalizeCountryCode(country);
  if (!normalized) return null;
  return (
    SUPPORTED_PHONE_COUNTRIES.find((entry) => entry.countryCode === normalized) ??
    null
  );
}

export function toflag(country: string | null | undefined) {
  switch (normalizeCountryCode(country)) {
    case "UK":
      return META_ICONS.ukFlag;
    case "USA":
      return META_ICONS.uSFlagIcon;
    case "IE":
      return META_ICONS.ieFlag;
    case "ZW":
      return META_ICONS.zimFlag;
    case "NL":
      return META_ICONS.nlFlag;
    case "FR":
      return META_ICONS.frFlag;
    case "JP":
      return META_ICONS.jpFlag;
    default:
      return null;
  }
}

export function toDialCode(country: string | null | undefined): string | null {
  return phoneCountryEntry(country)?.dialCode ?? null;
}

export function toIsoCountryCode(country: string | null | undefined) {
  switch (normalizeCountryCode(country)) {
    case "UK":
      return "GB";
    case "USA":
      return "US";
    case "IE":
      return "IE";
    case "ZW":
      return "ZW";
    case "NL":
      return "NL";
    case "FR":
      return "FR";
    case "JP":
      return "JP";
    default:
      return null;
  }
}

export function toCountryName(
  country: string | null | undefined,
): string | null {
  return phoneCountryEntry(country)?.name ?? null;
}

/** Maps profile DB values, ISO codes, and display names to app country codes. */
export function normalizeCountryCode(
  country: string | null | undefined,
): string | null {
  if (!country?.trim()) return null;

  const value = country.trim();
  const compact = value.toLowerCase().replace(/\s+/g, " ");

  switch (compact) {
    case "gb":
    case "uk":
    case "united kingdom":
      return "UK";
    case "us":
    case "usa":
    case "united states":
    case "united states of america":
      return "USA";
    case "ie":
    case "ireland":
      return "IE";
    case "nl":
    case "netherlands":
      return "NL";
    case "fr":
    case "france":
      return "FR";
    case "jp":
    case "japan":
      return "JP";
    case "zw":
    case "zimbabwe":
      return "ZW";
    default:
      return value;
  }
}

/**
 * Expands selected country codes/names to every stored alias so DB `.in()` /
 * client filters match both code ("NL") and name ("Netherlands") rows.
 */
export function expandOriginCountryFilterValues(
  countries: string[],
): string[] {
  const values = new Set<string>();

  for (const raw of countries) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    values.add(trimmed);

    const code = normalizeCountryCode(trimmed);
    if (code) {
      values.add(code);
      const name = toCountryName(code);
      if (name) values.add(name);
    }

    const asName = toCountryName(trimmed);
    if (asName) values.add(asName);
  }

  return [...values];
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
