/** Platform fee: 20% of traveler payout. Sender pays payout + fee. */

const PLATFORM_FEE_RATE = 0.2;

const countryToCurrency: Record<string, string> = {
  uk: "gbp",
  gb: "gbp",
  "united kingdom": "gbp",
  usa: "usd",
  us: "usd",
  "united states": "usd",
  "united states of america": "usd",
  zimbabwe: "usd",
  zw: "usd",
  nl: "eur",
  netherlands: "eur",
  "south africa": "zar",
  za: "zar",
};

export type PaymentAmountBreakdown = {
  currency: string;
  travelerPayoutAmount: number;
  platformFeeAmount: number;
  paymentAmount: number;
};

function currencyForCountry(country: string | null | undefined): string {
  const key = country?.trim().toLowerCase() ?? "";
  return countryToCurrency[key] ?? "usd";
}

/** Convert major units (e.g. 25.50 GBP) to Stripe smallest unit (pence/cents). */
function toStripeAmount(majorUnits: number, currency: string): number {
  const zeroDecimal = new Set(["jpy"]);
  const factor = zeroDecimal.has(currency) ? 1 : 100;
  return Math.round(majorUnits * factor);
}

export function calculatePaymentAmountsFromParcel(
  pricePerKg: number,
  weightKg: number,
  originCountry: string | null | undefined,
): PaymentAmountBreakdown {
  const currency = currencyForCountry(originCountry);
  const travelerPayoutMajor = pricePerKg * weightKg;
  const platformFeeMajor = travelerPayoutMajor * PLATFORM_FEE_RATE;
  const paymentMajor = travelerPayoutMajor + platformFeeMajor;

  const travelerPayoutAmount = toStripeAmount(travelerPayoutMajor, currency);
  const platformFeeAmount = toStripeAmount(platformFeeMajor, currency);
  const paymentAmount = toStripeAmount(paymentMajor, currency);

  if (paymentAmount < 50) {
    throw new Error("Payment amount is below the minimum charge.");
  }

  return {
    currency,
    travelerPayoutAmount,
    platformFeeAmount,
    paymentAmount,
  };
}
