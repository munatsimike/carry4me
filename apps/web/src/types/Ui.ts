export type SvgIconComponent = React.ComponentType<
  React.SVGProps<SVGSVGElement>
>;
export type Stat = {
  Icon: SvgIconComponent;
  label: string;
  value: string;
};
