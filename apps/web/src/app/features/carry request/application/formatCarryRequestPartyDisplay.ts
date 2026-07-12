import { formatPersonDisplayName } from "@/app/shared/application/formatPersonDisplayName";
import { ROLES, type Role } from "../domain/CreateCarryRequest";

const VIEWER_PARTY_LABEL = "You";

export function formatSenderPartyDisplay(
  viewerRole: Role,
  senderName: string,
): string {
  if (viewerRole === ROLES.SENDER) {
    return VIEWER_PARTY_LABEL;
  }
  return formatPersonDisplayName(senderName);
}

export function formatTravelerPartyDisplay(
  viewerRole: Role,
  travelerName: string,
): string {
  if (viewerRole === ROLES.TRAVELER) {
    return VIEWER_PARTY_LABEL;
  }
  return formatPersonDisplayName(travelerName);
}
