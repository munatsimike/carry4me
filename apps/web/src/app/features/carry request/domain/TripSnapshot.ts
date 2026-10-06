export type TripSnapshot = {
  traveler_name: string;
  departure_date: string; // ISO string
  capacity_unit?: "kg" | "bag";
  origin: {
    country: string;
    city: string;
  };
  destination: {
    country: string;
    city: string;
  };
};
