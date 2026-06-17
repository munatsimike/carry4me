/** Step field groups — kept separate to avoid circular imports with useParcelForm. */
export const parcelStep1Fields = [
  "originCountry",
  "originCity",
  "originCustomCity",
  "destinationCountry",
  "destinationCity",
  "goodsCategoryIds",
] as const;

export const parcelStep2Fields = ["itemDescriptions"] as const;

export const parcelStep3Fields = ["weight", "pricePerKg"] as const;

export const parcelStep4Fields = [
  "confirmNoProhibitedItems",
  "understandTravelerInspection",
] as const;
