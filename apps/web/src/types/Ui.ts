import type { Status } from "@/app/features/carry request/ui/CarryRequestMapper";

export type SvgIconComponent = React.ComponentType<
  React.SVGProps<SVGSVGElement>
>;
export type Tag = "traveler" | "sender";

export type InfoItem = {
  tag?: Tag;
  Icon?: SvgIconComponent;
  label: string;
  value: string;
};

export type InfoItemsProps = {
  tag?: Tag;
  items: InfoItem[];
};

export type Step = {
  step: number;
  title: string;
  description: string;
};

export type StepsPros = {
  steps: Step[];
};

export type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

type Category = "Documents" | "Clothes & Shoes" | "Electronics";
export type Location = "Zimbabwe" | "USA" | "UK";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string; // optional (not everyone uploads one)
};

export type Route = {
  date: Date;
  availableWeight: number;
  pricePerKg: number;
  origin: Location;
  destination: Location;
  acceptedParcels: Category[];
};

export type TestUITrip = {
  id: number;
  user: User;
  route: Route;
};

type ParcelRequirements = {
  date?: Date;
  pricePerKg: number;
  weight: number;
  origin: Location;
  destination: Location;
  category: Category[];
};

export type Parcel = {
  id: number;
  user: User;
  details: ParcelRequirements;
};

export const progress = {
  1: "Request sent",
  2: "Request accepted",
  3: "Payment completed",
  4: "Parcel received",
  5: "Delivered",
  6: "Payment released",
} as const;

export type CarryRequest = {
  id: number;
  trip: TestUITrip;
  parcel: Parcel;

  status: Status;
  initiatorRole: InitiatorRole;

  pricePerKgAtRequest: number;
  weightKgAtRequest: number;
  totalPriceAtRequest: number;
  currency: "GBP" | "USD" | "EUR";
};

export const ROLES = {
  SENDER: "SENDER",
  TRAVELER: "TRAVELER",
};
export type InitiatorRole = Role;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const INFOMODES = {
  DISPLAY: "DISPLAY",
  INPUT: "INPUT",
};
export type InfoBlockMode = (typeof INFOMODES)[keyof typeof INFOMODES];
