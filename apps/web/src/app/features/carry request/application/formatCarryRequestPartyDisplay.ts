import { formatPersonDisplayName } from "@/app/shared/application/formatPersonDisplayName";
import { ROLES, type Role } from "../domain/CreateCarryRequest";

const VIEWER_PARTY_LABEL = "You";

type PartyDisplayOptions = {
  viewerUserId?: string | null;
  partyUserId?: string | null;
};

function isViewerParty(
  matchesRole: boolean,
  options?: PartyDisplayOptions,
): boolean {
  if (matchesRole) return true;
  const viewerUserId = options?.viewerUserId?.trim();
  const partyUserId = options?.partyUserId?.trim();
  return Boolean(viewerUserId && partyUserId && viewerUserId === partyUserId);
}

export function formatSenderPartyDisplay(
  viewerRole: Role,
  senderName: string,
  options?: PartyDisplayOptions,
): string {
  if (isViewerParty(viewerRole === ROLES.SENDER, options)) {
    return VIEWER_PARTY_LABEL;
  }
  return formatPersonDisplayName(senderName);
}

export function formatTravelerPartyDisplay(
  viewerRole: Role,
  travelerName: string,
  options?: PartyDisplayOptions,
): string {
  if (isViewerParty(viewerRole === ROLES.TRAVELER, options)) {
    return VIEWER_PARTY_LABEL;
  }
  return formatPersonDisplayName(travelerName);
}
