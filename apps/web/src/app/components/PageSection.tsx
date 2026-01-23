export default function PageSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col items-center mb-10">{children}</div>;
}
