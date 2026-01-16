export type SvgIconComponent = React.ComponentType<
  React.SVGProps<SVGSVGElement>
>;
type Tag = "traveler" | "sender";
export type InfoItem = {
  tag?: Tag;
  Icon: SvgIconComponent;
  label: string;
  value: string;
};

export type InfoItemsProps = {
  tag?: Tag;
  items: InfoItem[];
  iconCirlce?: boolean;
};

export type Step = {
  step: number;
  title: string;
  description: string;
};

export type StepsPros = {
  steps: Step[];
};
