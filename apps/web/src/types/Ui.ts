export type SvgIconComponent = React.ComponentType<
  React.SVGProps<SVGSVGElement>
>;
export type InfoItem = {
  Icon: SvgIconComponent;
  label: string;
  value: string;
};

export type Step = {
  step: number;
  title: string;
  description: string;
};
