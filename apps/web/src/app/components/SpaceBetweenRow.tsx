export default function SpaceBetweenRow({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex items justify-between">{children}</div>;
}
