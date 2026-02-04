export type CreateParcel = {
  senderUserId: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  weightKg: number;
  items: ParcelItem[];
};

export type ParcelItem = {
  quantity: number;
  description: string;
};
