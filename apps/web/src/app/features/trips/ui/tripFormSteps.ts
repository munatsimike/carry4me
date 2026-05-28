/** Step field groups — kept separate to avoid circular imports with useTripForm. */
export const tripStep1Fields = [
  "originCountry",
  "originCity",
  "originCustomCity",
  "destinationCountry",
  "destinationCity",
  "departureDate",
] as const;

export const tripStep2Fields = [
  "goodsCategoryIds",
  "weight",
  "pricePerKg",
] as const;