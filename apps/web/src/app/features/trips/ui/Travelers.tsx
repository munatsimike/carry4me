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
    <div className="grid grid-col-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {trips.map((trip, index) => (
        <TravelerCard
          key={index}
          trip={trip}
          onClick={onClick}
          setTrips={onToggleLikd}
        />
      ))}
    </div>
  );
}
