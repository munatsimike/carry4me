import { countMatchesForPostedListing } from "@/app/features/dashboard/application/suggestedMatches";
import type { InfoModalPayload } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import {
  getParcelsUseCase,
  getTripsUseCase,
  myParcelsUseCase,
  myTripsUseCase,
} from "@/app/lib/useCases";
import type { NavigateFunction } from "react-router-dom";

type PostedListingType = "parcel" | "trip";
type ListingSaveAction = "create" | "edit";
export type SuggestedMatchTab = "trips" | "parcels";

export function suggestedMatchTabForListing(
  listingType: PostedListingType,
): SuggestedMatchTab {
  return listingType === "trip" ? "parcels" : "trips";
}

export async function countActorMatchesForListing(
  userId: string,
  listingType: PostedListingType,
  listingId: string,
): Promise<number> {
  if (listingType === "trip") {
    const trips = await myTripsUseCase.execute(userId, listingId);
    const source = trips[0];
    if (!source) return 0;

    const parcels = await getParcelsUseCase.execute(userId);
    return countMatchesForPostedListing(source, parcels, userId);
  }

  const parcels = await myParcelsUseCase.execute(userId);
  const source = parcels.find((parcel) => parcel.id === listingId);
  if (!source) return 0;

  const trips = await getTripsUseCase.execute(userId);
  return countMatchesForPostedListing(source, trips, userId);
}

function listingSavedTitle(
  listingType: PostedListingType,
  action: ListingSaveAction,
): string {
  if (action === "create") {
    return listingType === "trip" ? "Trip posted" : "Parcel posted";
  }
  return listingType === "trip" ? "Trip updated" : "Parcel updated";
}

function listingSavedMessage(
  listingType: PostedListingType,
  action: ListingSaveAction,
): string {
  if (action === "create") {
    return listingType === "trip"
      ? "Your trip has been posted successfully."
      : "Your parcel has been posted successfully.";
  }
  return listingType === "trip"
    ? "Your trip has been updated successfully."
    : "Your parcel has been updated successfully.";
}

export function promptActorSuggestedMatches(
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void,
  navigate: NavigateFunction,
  input: {
    listingType: PostedListingType;
    action: ListingSaveAction;
    matchCount: number;
  },
): void {
  const { listingType, action, matchCount } = input;
  const title = listingSavedTitle(listingType, action);
  const savedMessage = listingSavedMessage(listingType, action);
  const counterpart = listingType === "trip" ? "parcel" : "trip";
  const counterpartPlural = listingType === "trip" ? "parcels" : "trips";

  const viewMatches = () =>
    navigate("/dashboard#suggested-matches", {
      state: { suggestedMatchTab: suggestedMatchTabForListing(listingType) },
    });

  if (matchCount > 0) {
    const counterpartLabel =
      matchCount === 1 ? counterpart : `${counterpart}s`;

    openInfo({
      title,
      message: savedMessage,
      messageDetail: `We found ${matchCount} matching ${counterpartLabel}.`,
      label: "View matches",
      secondaryLabel: "Close",
      onClick: viewMatches,
    });
    return;
  }

  openInfo({
    title,
    message: savedMessage,
    messageDetail: `There are no matching ${counterpartPlural} right now. You will be notified when a matching ${counterpart} is posted.`,
    label: "Close",
  });
}

export async function notifyActorSuggestedMatches(
  userId: string,
  listingType: PostedListingType,
  listingId: string,
  action: ListingSaveAction,
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void,
  navigate: NavigateFunction,
): Promise<void> {
  const matchCount = await countActorMatchesForListing(
    userId,
    listingType,
    listingId,
  );

  promptActorSuggestedMatches(openInfo, navigate, {
    listingType,
    action,
    matchCount,
  });
}
