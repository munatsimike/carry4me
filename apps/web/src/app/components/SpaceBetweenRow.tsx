export default function SpaceBetweenRow({
  children, className
}: {
  children: React.ReactNode;
  className?: string
}) {
  return <div className={["flex items justify-between", className ?? ""].join(" ")}>{children}</div>;
}
