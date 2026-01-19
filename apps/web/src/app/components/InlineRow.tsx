

//layout wrapper used to align items horizontally with consistent spacing.
type InlineRowProps = {
  children: React.ReactNode;
  gap?: "1" | "2" | "3" | "4";
};

export function InlineRow({ children, gap = "3" }: InlineRowProps) {
  return (
    <span
      className={`inline-flex items-center gap-${gap}`}
    >
      {children}
    </span>
  );
}
