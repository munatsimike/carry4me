import type { TripListing } from "../domain/Trip";
import type { CardMode } from "@/types/Ui";
import { ListingCard } from "@/app/components/card/ListingCard";

type TravelerProps = {
  trip: TripListing;
  mode: CardMode;
  onClick: (trip: TripListing) => void;
};

export default function TravelerCard({ trip, onClick, mode }: TravelerProps) {
  return <ListingCard mode={mode} listing={trip} onClick={onClick} />;
}
