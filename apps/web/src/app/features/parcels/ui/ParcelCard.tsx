
import type { ParcelListing } from "@/app/features/parcels/domain/Parcel";
import type { CardMode } from "@/types/Ui";
import { ListingCard } from "@/app/components/card/ListingCard";

type ParcelProps = {
  parcel: ParcelListing;
  onClick: (parcel: ParcelListing) => void;
  mode?: CardMode;
};

export default function ParcelCard({
  parcel,
  onClick,
  mode = "display",
}: ParcelProps) {
  
  return (
    <ListingCard
      mode={mode}
      listing={parcel}
      onClick={onClick}
    />
  );
}

