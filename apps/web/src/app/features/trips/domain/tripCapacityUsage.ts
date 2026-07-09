export type TripCapacityUrgency = "comfortable" | "low" | "critical";

export function getTripBookedWeightKg(
  capacityKg: number | undefined,
  availableKg: number,
): number {
  if (!capacityKg || capacityKg <= 0) return 0;

  return Math.max(0, Math.min(capacityKg, capacityKg - availableKg));
}

export function getTripCapacityRemainingPercent(
  capacityKg: number | undefined,
  availableKg: number,
): number {
  if (!capacityKg || capacityKg <= 0) return 0;

  return Math.min(100, Math.max(0, (availableKg / capacityKg) * 100));
}

export function getTripCapacityUrgency(
  availableKg: number,
): TripCapacityUrgency {
  if (availableKg <= 2) return "critical";
  if (availableKg <= 5) return "low";
  return "comfortable";
}

export function getTripRemainingLabel(availableKg: number): string {
  if (getTripCapacityUrgency(availableKg) === "comfortable") {
    return `${availableKg} kg left`;
  }

  return `Only ${availableKg} kg left`;
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
