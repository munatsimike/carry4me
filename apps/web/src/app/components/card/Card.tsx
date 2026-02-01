type CardProps = {
  children: React.ReactNode;
  className?: string;
  cornerRadiusClass?: string;
  hover?: boolean;
};

export function Card({
  children,
  className,
  hover = true,
  cornerRadiusClass = "rounded-2xl",
}: CardProps) {
  const hoverClass = hover
    ? "transition-shadow transition-colors duration-200 hover:shadow-primary-300 hover:border-primary-300"
    : "";

  return (
    <div
      className={[
        "border border-neutral-50 bg-white p-5 shadow-sm",
        "motion-safe:animate-scale-in",
        cornerRadiusClass,
        hoverClass,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
