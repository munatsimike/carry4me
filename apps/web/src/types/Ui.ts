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

export type Route = {
  date: Date;
  availableWeight: number;
  pricePerKg: number;
  origin: Location;
  destination: Location;
  acceptedParcels: Category[];
};

export type GoodsItem = {
  quantity: number;
  description: string;
};

export type FormValues = {
  id: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  goodsCategoryIds: string[];
  itemDescriptions: GoodsItem[];
  weight: number;
  pricePerKg: number;
  agreeToRules: false;
  senderId: string;
  departureDate?: string;
};

export type FormMode = "edit" | "create";
export type CardMode = "preview" | "display";

export const progress = {
  1: "Request sent",
  2: "Request accepted",
  3: "Payment completed",
  4: "Parcel received",
  5: "Delivered",
  6: "Payment released",
} as const;

export const INFOMODES = {
  DISPLAY: "DISPLAY",
  INPUT: "INPUT",
};
export type InfoBlockMode = (typeof INFOMODES)[keyof typeof INFOMODES];

export type CustomRange = {
  min: number;
  max: number;
};

export const dateFormat = "d MMM yyy";

export type SortOption = "date-asc" | "price-asc" | "price-desc" | "weight-desc";
