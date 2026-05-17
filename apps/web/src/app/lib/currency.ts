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
  "south africa": "ZAR",
  za: "ZAR",
  canada: "CAD",
  australia: "AUD",
  "new zealand": "NZD",
  japan: "JPY",
  china: "CNY",
  india: "INR",
  eu: "EUR",
  europe: "EUR",
  ...(Object.fromEntries(
    euroCountries.map((country) => [country, "EUR"]),
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
