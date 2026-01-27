export type Trip = {
  id: string;
  route: {
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
    pricePerKg: number;
  };
  capacityKg: number;
  departDate: string;
  arriveDate?: string | null;
  status: "open" | "closed";
};
