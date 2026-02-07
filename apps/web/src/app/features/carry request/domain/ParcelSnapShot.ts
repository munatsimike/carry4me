export type ParcelSnapshot = {
  senderName: string;
  items: {
    quantity: number;
    description: string;
  }[];
  weightKg: number;
  pricePerKg: number;
  origin: {
    country: string;
    city: string;
  };
  destination: {
    country: string;
    city: string;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
};
