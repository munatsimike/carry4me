export type TripCapacityUrgency = "comfortable" | "low" | "critical";

export function getTripBookedWeightKg(
  capacityKg: number | undefined,
  availableKg: number,
): number {
  if (!capacityKg || capacityKg <= 0) return 0;

  return Math.max(0, Math.min(capacityKg, capacityKg - availableKg));
}

/** Share of capacity still available (0–100). */
export function getTripCapacityRemainingPercent(
  capacityKg: number | undefined,
  availableKg: number,
): number {
  if (!capacityKg || capacityKg <= 0) return 0;

  return Math.min(100, Math.max(0, (availableKg / capacityKg) * 100));
}

/** Share of capacity already booked (0–100). Drives the progress fill. */
export function getTripCapacityBookedPercent(
  capacityKg: number | undefined,
  availableKg: number,
): number {
  if (!capacityKg || capacityKg <= 0) return 0;

  const bookedKg = getTripBookedWeightKg(capacityKg, availableKg);
  return Math.min(100, Math.max(0, (bookedKg / capacityKg) * 100));
}

/**
 * Urgency from how much capacity is left:
 * - > 50% left → green
 * - > 25% and ≤ 50% left → orange
 * - ≤ 25% left → red
 */
export function getTripCapacityUrgency(
  capacityKg: number | undefined,
  availableKg: number,
): TripCapacityUrgency {
  const remainingPercent = getTripCapacityRemainingPercent(
    capacityKg,
    availableKg,
  );

  if (remainingPercent <= 25) return "critical";
  if (remainingPercent <= 50) return "low";
  return "comfortable";
}

export function getTripRemainingLabel(availableKg: number): string {
  return `${availableKg} kg left`;
}

export const tripCapacityUrgencyStyles: Record<
  TripCapacityUrgency,
  { fill: string; track: string }
> = {
  comfortable: {
    fill: "bg-success-500",
    track: "bg-success-100",
  },
  low: {
    fill: "bg-amber-500",
    track: "bg-amber-100",
  },
  critical: {
    fill: "bg-error-500",
    track: "bg-error-100",
  },
};

/** Unused capacity — full bar in a quiet neutral tone. */
export const tripCapacityUnusedStyles = {
  fill: "bg-neutral-300",
  track: "bg-neutral-100",
  dot: "bg-neutral-500",
} as const;
