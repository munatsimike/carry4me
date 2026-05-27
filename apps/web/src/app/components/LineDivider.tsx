import { cn } from "@/app/lib/cn";

type LineDividerProps = {
  /** Vertical margin around the rule (e.g. `my-4`, `my-0`). */
  heightClass?: string;
  className?: string;
};

/** Shared horizontal rule for cards, carry requests, listings, and modals. */
export default function LineDivider({
  heightClass = "my-4",
  className,
}: LineDividerProps) {
  return (
    <div
      role="separator"
      className={cn("w-full border-t border-neutral-100", heightClass, className)}
    />
  );
}

/** Alias for modal section breaks (same rule as LineDivider). */
export function ModalSeparator({ className }: { className?: string }) {
  return <LineDivider heightClass="" className={className} />;
}
