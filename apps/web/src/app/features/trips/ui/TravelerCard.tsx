import type { TripListing } from "../domain/Trip";
import type { CardMode } from "@/types/Ui";
import { ListingCard } from "@/app/components/card/ListingCard";

type TravelerProps = {
  trip: TripListing;
  mode?: CardMode;
  onClick: (trip: TripListing) => void;
  setTrips: (v:string)=>void;
};

export default function TravelerCard({
  trip,
  onClick,
  setTrips,
  mode = "display",
}: TravelerProps) {
  return (
    <ListingCard
      mode={mode}
      listing={trip}
      onClick={onClick}
      toggleLike={setTrips}
    />
  );
}
