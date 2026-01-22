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

export type Trip = {
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
  user: User;
  details: ParcelRequirements;
};
