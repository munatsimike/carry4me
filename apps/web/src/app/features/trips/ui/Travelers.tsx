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
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
