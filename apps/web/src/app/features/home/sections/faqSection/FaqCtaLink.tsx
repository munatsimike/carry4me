import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

type FaqCtaLinkProps = {
  className?: string;
};

export default function FaqCtaLink({ className }: FaqCtaLinkProps) {
  return (
    <Link
      to="/travelers"
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border border-primary-100/50",
        "bg-primary-50/40 px-4 py-3 text-left transition-colors",
        "hover:border-primary-100 hover:bg-primary-50/65",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
        className,
      )}
    >
      <CustomText
        as="span"
        textSize="sm"
        className="leading-relaxed text-primary-700/90"
      >
        Browse current trips and parcel requests to see how Carry4Me works.
      </CustomText>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-primary-500/60"
        aria-hidden
      />
    </Link>
  );
}
