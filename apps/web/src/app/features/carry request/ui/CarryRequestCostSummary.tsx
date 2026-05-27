import { formatCurrencyByCountry } from "@/app/lib/currency";
import { cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import {
  calculateCarryRequestPricing,
  SERVICE_FEE_TOOLTIP,
} from "../domain/carryRequestPricing";

const serviceFeeTooltipClass =
  "pointer-events-none absolute left-1/2 bottom-full z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-lg opacity-0 translate-y-1 scale-95 transition-all duration-300 ease-out group-hover/service-fee:translate-y-0 group-hover/service-fee:scale-100 group-hover/service-fee:opacity-100";

export function ServiceFeeRow({
  priceCountry,
  serviceFee,
}: {
  priceCountry: string;
  serviceFee: number;
}) {
  return (
    <div className="group/service-fee relative col-span-2 grid grid-cols-[minmax(0,1fr)_auto] overflow-visible">
      <CustomText textVariant="secondary" textSize="sm">
        Service fee
      </CustomText>
      <CustomText textVariant="primary" textSize="sm" className="text-right tabular-nums">
        {formatCurrencyByCountry(priceCountry, serviceFee)}
      </CustomText>
      <span className={serviceFeeTooltipClass}>{SERVICE_FEE_TOOLTIP}</span>
    </div>
  );
}

type CarryRequestCostSummaryProps = {
  weightKg: number;
  pricePerKg: number;
  priceCountry: string;
  /** When false, only shows weight, price/kg, and delivery total. */
  showServiceFee?: boolean;
  totalLabel?: string;
  size?: "default" | "compact";
  className?: string;
};

/** Reusable cost block for review request modal and carry request cards. */
export function CarryRequestCostSummary({
  weightKg,
  pricePerKg,
  priceCountry,
  showServiceFee = true,
  totalLabel,
  size = "default",
  className,
}: CarryRequestCostSummaryProps) {
  const { deliveryTotal, serviceFee, totalWithFee } = calculateCarryRequestPricing(
    pricePerKg,
    weightKg,
  );
  const resolvedTotalLabel =
    totalLabel ?? (showServiceFee ? "Total to pay" : "Total");
  const displayTotal = showServiceFee ? totalWithFee : deliveryTotal;

  return (
    <section className={cn("min-w-0 space-y-3 overflow-visible", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-neutral-100 bg-neutral-100 text-ink-primary",
          size === "compact"
            ? "px-3 py-1"
            : "h-7 px-4 text-sm font-light",
        )}
      >
        <CustomText
          textVariant="primary"
          as="span"
          textSize={size === "compact" ? "xs" : "sm"}
          className={size === "compact" ? undefined : "font-light"}
        >
          Cost summary
        </CustomText>
      </span>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-1 overflow-visible">
        <CustomText textVariant="secondary" textSize="sm">
          Parcel weight
        </CustomText>
        <CustomText textVariant="primary" textSize="sm" className="text-right">
          {weightKg}kg
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Price per kg
        </CustomText>
        <CustomText textVariant="primary" textSize="sm" className="text-right tabular-nums">
          {formatCurrencyByCountry(priceCountry, pricePerKg)}
        </CustomText>

        {showServiceFee ? (
          <ServiceFeeRow priceCountry={priceCountry} serviceFee={serviceFee} />
        ) : null}

        <CustomText textVariant="primary" textSize="md" className="font-medium">
          {resolvedTotalLabel}
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="md"
          className="text-right font-semibold tabular-nums"
        >
          {formatCurrencyByCountry(priceCountry, displayTotal)}
        </CustomText>
      </div>
    </section>
  );
}

/** @deprecated Use CarryRequestCostSummary — kept for existing imports. */
export function RequestCostSummarySection(
  props: CarryRequestCostSummaryProps,
) {
  return <CarryRequestCostSummary {...props} />;
}
