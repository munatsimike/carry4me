export const TRIP_CAPACITY_UNITS = {
  KG: "kg",
  BAG: "bag",
} as const;

export type TripCapacityUnit =
  (typeof TRIP_CAPACITY_UNITS)[keyof typeof TRIP_CAPACITY_UNITS];

export function isTripCapacityBags(
  unit?: string | null,
): unit is typeof TRIP_CAPACITY_UNITS.BAG {
  return unit === TRIP_CAPACITY_UNITS.BAG;
}

export function normalizeTripCapacityUnit(
  unit?: string | null,
): TripCapacityUnit {
  return isTripCapacityBags(unit)
    ? TRIP_CAPACITY_UNITS.BAG
    : TRIP_CAPACITY_UNITS.KG;
}

export function formatTripSpaceAmount(quantity: number): string {
  return Number.isInteger(quantity)
    ? String(quantity)
    : quantity.toFixed(1).replace(/\.0$/, "");
}

export function formatTripSpace(quantity: number, unit?: string | null): string {
  const amount = formatTripSpaceAmount(quantity);
  if (isTripCapacityBags(unit)) {
    return quantity === 1 ? "1 bag" : `${amount} bags`;
  }
  return `${amount}kg`;
}

export function formatTripSpaceLeft(
  quantity: number,
  unit?: string | null,
): string {
  if (isTripCapacityBags(unit)) {
    return quantity === 1 ? "1 bag left" : `${formatTripSpaceAmount(quantity)} bags left`;
  }
  return `${formatTripSpaceAmount(quantity)} kg left`;
}

export function formatTripBooked(quantity: number, unit?: string | null): string {
  if (isTripCapacityBags(unit)) {
    return quantity === 1 ? "1 bag booked" : `${formatTripSpaceAmount(quantity)} bags booked`;
  }
  return `${formatTripSpaceAmount(quantity)} kg booked`;
}

/** One request on a bag trip uses one bag. Kg trips use the parcel weight. */
export function tripPricingQuantity(
  unit: string | null | undefined,
  parcelWeightKg: number,
): number {
  return isTripCapacityBags(unit) ? 1 : parcelWeightKg;
}

export function parcelFitsTripCapacity(
  parcelWeightKg: number,
  tripRemaining: number,
  unit?: string | null,
): boolean {
  if (isTripCapacityBags(unit)) return tripRemaining >= 1;
  return parcelWeightKg <= tripRemaining;
}
