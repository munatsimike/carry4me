export type TripSnapshot = {
  travelerName:string,
  departureDate: string; // ISO string
  origin: {
    country: string;
    city: string;
  };
  destination: {
    country: string;
    city: string;
  };
};
