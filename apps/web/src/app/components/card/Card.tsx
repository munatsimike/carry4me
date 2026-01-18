type CardProps = {
  children: React.ReactNode;
  className?: string;
};


// resuable card layout
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-neutral-50 bg-white p-5 shadow-sm",
        "transition hover:shadow-md",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
