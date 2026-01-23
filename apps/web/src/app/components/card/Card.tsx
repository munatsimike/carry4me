type CardProps = {
  children: React.ReactNode;
  className?: string;
  cornerRadiusClass?: string;
  hover?: boolean;
};

// resuable card layout
export function Card({
  children,
  className,
  hover = true,
  cornerRadiusClass = "rounded-2xl",
}: CardProps) {
  const hoverClass = hover
    ? "transition hover:shadow-neutral-200 hover:border-tertiary-100"
    : "";
  return (
    <div
      className={[
        "rounded-2xl border border-neutral-50 bg-white p-5 shadow-sm",
        cornerRadiusClass,
        hoverClass,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
