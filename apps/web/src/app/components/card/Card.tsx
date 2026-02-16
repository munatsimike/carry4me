type CardProps = {
  children: React.ReactNode;
  className?: string;
  cornerRadiusClass?: string;
  borderClass?: string;
  hover?: boolean;
  paddingClass?:string
  shadowClass?:string
};

export function Card({
  children,
  className,
  hover = true,
  paddingClass = "p-5",
  borderClass = "border border-neutral-200",
  cornerRadiusClass = "rounded-2xl",
  shadowClass = "shadow-sm"
}: CardProps) {
  const hoverClass = hover
    ? "transition-shadow transition-colors duration-200 hover:border-primary-400"
    : "";

  return (
    <div
      className={[
        "bg-white",
        "motion-safe:animate-scale-in",
        shadowClass,
        paddingClass,
        cornerRadiusClass,
        borderClass,
        hoverClass,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
