import MarketplaceListingGrid from "@/app/components/MarketplaceListingGrid";
import type { TripListing } from "../domain/Trip";
import TravelerCard from "./TravelerCard";

export type TravlersProps = {
  trips: TripListing[];
  onClick: (trip: TripListing) => void;
  onToggleLikd: (v: string) => void;
};
export default function Travelers({
  trips,
  onClick,
  onToggleLikd,
}: TravlersProps) {
  return (
    <MarketplaceListingGrid>
      {trips.map((trip) => (
        <TravelerCard
          key={trip.id}
          trip={trip}
          onClick={onClick}
          setTrips={onToggleLikd}
        />
      ))}
    </MarketplaceListingGrid>
  );
}
