export type TripSnapshot = {
  traveler_name:string,
  departure_date: string; // ISO string
  origin: {
    country: string;
    city: string;
  };
  destination: {
    country: string;
    city: string;
  };
};
