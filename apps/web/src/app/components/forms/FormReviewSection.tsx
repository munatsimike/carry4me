import type { ReactNode } from "react";
import InfoTooltip from "@/app/components/InfoTooltip";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
export function ReviewEditButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5",
        "text-xs font-medium text-primary-600 underline-offset-2 transition-colors",
        "hover:bg-primary-50 hover:text-primary-700 hover:underline",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1",
        className,
      )}
    >
      Edit
    </button>  );
}

export function FormReviewSection({
  label,
  labelHint,
  children,
  onEdit,
  className,
}: {
  label: string;
  labelHint?: string;
  children: ReactNode;
  onEdit?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <CustomText
            as="p"
            textSize="xs"
            textVariant="label"
            className="whitespace-nowrap"
          >
            {label}
          </CustomText>
          {labelHint ? <InfoTooltip content={labelHint} /> : null}
        </div>
        {onEdit ? <ReviewEditButton onClick={onEdit} /> : null}
      </div>
      {children}
    </div>
  );
}

export function FormReviewValue({ children }: { children: ReactNode }) {
  return (
    <CustomText as="p" textSize="sm" className="font-medium text-ink-primary">
      {children}
    </CustomText>
  );
}

export function FormReviewPrimaryValue({
  children,
  textSize = "sm",
}: {
  children: ReactNode;
  textSize?: "sm" | "md";
}) {
  return (
    <CustomText
      as="p"
      textSize={textSize}
      textVariant="primary"
      className="font-medium"
    >
      {children}
    </CustomText>
  );
}
