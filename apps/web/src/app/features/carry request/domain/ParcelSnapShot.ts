export type ParcelSnapshot = {
  sender_name: string;
  items: {
    quantity: number;
    description: string;
  }[];
  weight_kg: number;
  price_per_kg: number;
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
