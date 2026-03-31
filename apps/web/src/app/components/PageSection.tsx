import { useMediaQuery } from "../shared/Authentication/UI/hooks/useMediaQuery";

type Align = "left" | "right" | "center";

export default function PageSection({
  children,
  align = "center",
}: {
  align?: Align;
  children: React.ReactNode;
}) {
  const isMobile = useMediaQuery();
  const position = isMobile ? "left" : align;

  const alignment: Record<Align, string> = {
    left: "",
    right: "items-end",
    center: "items-center",
  };

  const base = `flex flex-col sm:py-2 gap-4 px-2 sm:px-5 lg:px-6 bg-white ${alignment[position]}`;

  return <div className={base}>{children}</div>;
}