type Align = "left" | "right" | "center";

export default function PageSection({
  children,
  align = "center",
}: {
  align?: Align;
  children: React.ReactNode;
}) {
  const alignment: Record<Align, string> = {
    left: "",
    right: "items-right",
    center: "items-center",
  };
  const base = `flex flex-col mb-10 ${alignment[align]}`;
  return <div className={base}>{children}</div>;
}
