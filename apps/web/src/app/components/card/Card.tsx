type CardProps = {
  children: React.ReactNode;
  className?: string;
};

// resuable card layout
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-neutral-50 bg-white p-5 shadow-md",
        "transition hover:shadow-neutral-200 hover:border-tertiary-100",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
