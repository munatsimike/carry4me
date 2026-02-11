type CardProps = {
  children: React.ReactNode;
  className?: string;
  cornerRadiusClass?: string;
  borderClass?: string;
  hover?: boolean;
};

export function Card({
  children,
  className,
  hover = true,
  borderClass = "border border-neutral-100",
  cornerRadiusClass = "rounded-2xl",
}: CardProps) {
  const hoverClass = hover
    ? "transition-shadow transition-colors duration-200 hover:shadow-primary-300 hover:border-primary-400"
    : "";

  return (
    <div
      className={[
        "bg-white p-5 shadow-sm",
        "motion-safe:animate-scale-in",
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
