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
  const base = `flex flex-col py-2 sm:py-4 gap-4 px-4 sm:px-5 lg:px-6 ${alignment[align]}`;
  return <div className={base}>{children}</div>;
}
