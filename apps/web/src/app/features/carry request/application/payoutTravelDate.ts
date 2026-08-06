import { format, parseISO } from "date-fns";

const PAYOUT_BEFORE_TRAVEL_MESSAGE =
  "Payout can only be released on or after the travel date.";

function utcCalendarDayMs(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * True when payout may proceed for this trip departure date.
 * Uses UTC calendar days to match edge/DB checks.
 * Fail-open on missing/invalid dates so normal releases are not bricked.
 */
export function hasTravelDatePassedForPayout(
  departureDateIso: string | null | undefined,
  now = new Date(),
): boolean {
  if (!departureDateIso?.trim()) return true;

  const departure = parseISO(departureDateIso);
  if (Number.isNaN(departure.getTime())) return true;

  return utcCalendarDayMs(now) >= utcCalendarDayMs(departure);
}

export function payoutBlockedBeforeTravelDateMessage(
  departureDateIso: string | null | undefined,
): string {
  if (!departureDateIso?.trim()) {
    return PAYOUT_BEFORE_TRAVEL_MESSAGE;
  }

  try {
    const formatted = format(parseISO(departureDateIso), "d MMM yyyy");
    return `${PAYOUT_BEFORE_TRAVEL_MESSAGE} Travel date: ${formatted}.`;
  } catch {
    return PAYOUT_BEFORE_TRAVEL_MESSAGE;
  }
}
