import type { Listing } from "@/app/shared/Authentication/domain/Listing";

type ConfirmListingStatusOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmListingStatusOptions) => Promise<boolean>;

export async function confirmListingStatusChange(
  listing: Listing,
  active: boolean,
  confirm: ConfirmFn,
): Promise<boolean> {
  const isTrip = listing.type === "trip";
  const noun = isTrip ? "trip" : "parcel";

  if (active) {
    return confirm({
      title: `Activate this ${noun}?`,
      message: isTrip
        ? "Your trip will appear on the marketplace again and you can receive new parcel requests."
        : "Your parcel will appear on the marketplace again and travelers can send new requests.",
      confirmText: `Activate ${noun}`,
      cancelText: "Cancel",
    });
  }

  return confirm({
    title: `Deactivate this ${noun}?`,
    message: isTrip
      ? "Your trip will be hidden from the marketplace. You can activate it again any time before departure."
      : "Your parcel will be hidden from the marketplace. You can activate it again at any time.",
    confirmText: `Deactivate ${noun}`,
    cancelText: "Cancel",
  });
}

export async function confirmListingDelete(
  listing: Listing,
  confirm: ConfirmFn,
): Promise<boolean> {
  const isTrip = listing.type === "trip";
  const noun = isTrip ? "trip" : "parcel";

  return confirm({
    title: `Delete this ${noun}?`,
    message: isTrip
      ? "This will permanently remove your trip listing and any related data. This action cannot be undone."
      : "This will permanently remove your parcel listing and any related data. This action cannot be undone.",
    confirmText: `Delete ${noun}`,
    cancelText: "Cancel",
    destructive: true,
  });
}
