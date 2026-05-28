import { cn } from "@/app/lib/cn";

type EmailVerificationBadgeProps = {
  verified: boolean;
  compact?: boolean;
  className?: string;
};

export default function EmailVerificationBadge({
  verified,
  compact = false,
  className,
}: EmailVerificationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full font-medium",
        compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        verified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-800",
        className,
      )}
    >
      {verified ? "Verified" : "Not verified"}
    </span>
  );
}
