
export type ParcelSnapshot = {
  senderName: string;
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

export type TripSnapshot = {
  traveler_name: string;
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

export type Role = "sender" | "traveler";
export type Status =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "in_progress"
  | "completed";

export type CarryRequest = {
  parcel_id: string;
  trip_id: string;
  sender_user_id: string;
  traveler_user_id: string;
  initiator_role: Role;
  status: Status;
  parcel_snapshot: ParcelSnapshot; // ✅ just the object
  trip_snapshot: TripSnapshot;
};
