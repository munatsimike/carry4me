export type CurrencyCode =
  | "USD"
  | "GBP"
  | "EUR"
  | "ZAR"
  | "CAD"
  | "AUD"
  | "NZD"
  | "JPY"
  | "CNY"
  | "INR";

export const DEFAULT_CURRENCY_CODE: CurrencyCode = "USD";

export const currencyCodeToSymbol: Record<CurrencyCode, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  ZAR: "R",
  CAD: "$",
  AUD: "$",
  NZD: "$",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
};

const euroCountries = [
  "andorra",
  "austria",
  "belgium",
  "croatia",
  "cyprus",
  "estonia",
  "finland",
  "france",
  "germany",
  "greece",
  "ireland",
  "italy",
  "latvia",
  "lithuania",
  "luxembourg",
  "malta",
  "monaco",
  "montenegro",
  "netherlands",
  "portugal",
  "san marino",
  "slovakia",
  "slovenia",
  "spain",
  "vatican city",
] as const;

/** ISO 3166-1 alpha-2 codes for Eurozone / EUR-using countries in the app. */
const euroCountryIsoCodes = [
  "ad",
  "at",
  "be",
  "hr",
  "cy",
  "ee",
  "fi",
  "fr",
  "de",
  "gr",
  "ie",
  "it",
  "lv",
  "lt",
  "lu",
  "mt",
  "mc",
  "me",
  "nl",
  "pt",
  "sm",
  "sk",
  "si",
  "es",
  "va",
] as const;

const countryToCurrencyCode: Record<string, CurrencyCode> = {
  uk: "GBP",
  gb: "GBP",
  "great britain": "GBP",
  "united kingdom": "GBP",
  usa: "USD",
  us: "USD",
  "united states": "USD",
  "united states of america": "USD",
  zimbabwe: "USD",
  zw: "USD",
  "south africa": "ZAR",
  za: "ZAR",
  canada: "CAD",
  ca: "CAD",
  australia: "AUD",
  au: "AUD",
  "new zealand": "NZD",
  nz: "NZD",
  japan: "JPY",
  jp: "JPY",
  china: "CNY",
  cn: "CNY",
  india: "INR",
  in: "INR",
  eu: "EUR",
  europe: "EUR",
  ...(Object.fromEntries(
    [...euroCountries, ...euroCountryIsoCodes].map((country) => [
      country,
      "EUR",
    ]),
  ) as Record<string, CurrencyCode>),
};

export function normalizeCountryKey(country?: string | null): string {
  return country?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

export function getCurrencyCodeByCountry(
  country?: string | null,
): CurrencyCode {
  const normalizedCountry = normalizeCountryKey(country);
  return countryToCurrencyCode[normalizedCountry] ?? DEFAULT_CURRENCY_CODE;
}

export function getCurrencySymbolByCode(currencyCode: CurrencyCode): string {
  return currencyCodeToSymbol[currencyCode];
}

export function getCurrencySymbolByCountry(country?: string | null): string {
  return getCurrencySymbolByCode(getCurrencyCodeByCountry(country));
}

type FormatCurrencyOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatCurrencyByCountry(
  country: string | null | undefined,
  amount: number,
  options: FormatCurrencyOptions = {},
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const formattedAmount = safeAmount.toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return `${getCurrencySymbolByCountry(country)}${formattedAmount}`;
}
