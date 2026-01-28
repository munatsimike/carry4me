//layout wrapper used to align items horizontally with consistent spacing.
type InlineRowProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: React.ReactNode;
  gap?: "1" | "2" | "3" | "4";
};

const gapMap = {
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
};

export function InlineRow({ children, gap = "3", ...props }: InlineRowProps) {
  return (
    <span {...props} className={`inline-flex items-center ${gapMap[gap]}`}>
      {children}
    </span>
  );
}
