/** Calendar-day comparison in UTC (YYYY-MM-DD). */
export function utcCalendarDayMs(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Whether traveler payout release is allowed for this trip departure date.
 * Fail-open when the snapshot date is missing/invalid so existing flows are not bricked.
 * Blocks only when departure is a clear future calendar day (UTC).
 */
export function isPayoutAllowedForTravelDate(
  departureDateIso: string | null | undefined,
  now = new Date(),
): boolean {
  if (!departureDateIso?.trim()) return true;

  const departure = new Date(departureDateIso);
  if (Number.isNaN(departure.getTime())) return true;

  return utcCalendarDayMs(now) >= utcCalendarDayMs(departure);
}
