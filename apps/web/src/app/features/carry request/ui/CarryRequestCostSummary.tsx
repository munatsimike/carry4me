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
  compact = false,
}: {
  priceCountry: string;
  serviceFee: number;
  compact?: boolean;
}) {
  return (
    <div className="group/service-fee relative col-span-2 grid grid-cols-[minmax(0,1fr)_auto] overflow-visible">
      <CustomText textVariant="secondary" textSize={compact ? "xs" : "sm"}>
        Service fee
      </CustomText>
      <CustomText
        textVariant="primary"
        textSize={compact ? "xs" : "sm"}
        className="text-right tabular-nums"
      >
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
  variant?: "default" | "embedded" | "receipt";
  className?: string;
};

/**
 * Traveler-facing payout breakdown for completed requests.
 * Gross = sender total paid; fee = platform cut; net = traveler payout.
 */
export function TravelerPaymentDetailsSummary({
  weightKg,
  pricePerKg,
  priceCountry,
  className,
}: {
  weightKg: number;
  pricePerKg: number;
  priceCountry: string;
  className?: string;
}) {
  const { deliveryTotal, serviceFee, totalWithFee } = calculateCarryRequestPricing(
    pricePerKg,
    weightKg,
  );
  const rateLabel = `${formatCurrencyByCountry(priceCountry, pricePerKg)}/kg`;
  const feeLabel = `-${formatCurrencyByCountry(priceCountry, serviceFee)}`;

  return (
    <section
      className={cn(
        "min-w-0 overflow-visible rounded-xl border border-slate-100/90 bg-white p-2.5",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-1.5 overflow-visible">
        <CustomText textVariant="secondary" textSize="sm">
          Parcel weight
        </CustomText>
        <CustomText textVariant="primary" textSize="sm" className="text-right">
          {weightKg} kg
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Rate
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="text-right tabular-nums"
        >
          {rateLabel}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm" className="pt-2.5">
          Gross earnings
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="pt-2.5 text-right tabular-nums"
        >
          {formatCurrencyByCountry(priceCountry, totalWithFee)}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Carry4Me fee
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="text-right tabular-nums text-red-600"
        >
          {feeLabel}
        </CustomText>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center border-t border-slate-100 pt-3">
        <CustomText textVariant="primary" textSize="sm" className="font-semibold">
          Net payout
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="text-right text-lg font-bold tabular-nums text-success-600"
        >
          {formatCurrencyByCountry(priceCountry, deliveryTotal)}
        </CustomText>
      </div>
    </section>
  );
}

/**
 * Sender-facing payment breakdown for completed requests.
 */
export function SenderPaymentDetailsSummary({
  weightKg,
  pricePerKg,
  priceCountry,
  className,
}: {
  weightKg: number;
  pricePerKg: number;
  priceCountry: string;
  className?: string;
}) {
  const { deliveryTotal, serviceFee, totalWithFee } = calculateCarryRequestPricing(
    pricePerKg,
    weightKg,
  );

  return (
    <section
      className={cn(
        "min-w-0 overflow-visible rounded-xl border border-slate-100/90 bg-white p-2.5",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-1.5 overflow-visible">
        <CustomText textVariant="secondary" textSize="sm">
          Parcel weight
        </CustomText>
        <CustomText textVariant="primary" textSize="sm" className="text-right">
          {weightKg} kg
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Rate per kg
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="text-right tabular-nums"
        >
          {formatCurrencyByCountry(priceCountry, pricePerKg)}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm" className="pt-2.5">
          Delivery charge
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="pt-2.5 text-right tabular-nums"
        >
          {formatCurrencyByCountry(priceCountry, deliveryTotal)}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Carry4Me fee
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="text-right tabular-nums"
        >
          {formatCurrencyByCountry(priceCountry, serviceFee)}
        </CustomText>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center border-t border-slate-100 pt-3">
        <CustomText textVariant="primary" textSize="sm" className="font-semibold">
          Total paid
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="text-right text-lg font-bold tabular-nums text-success-600"
        >
          {formatCurrencyByCountry(priceCountry, totalWithFee)}
        </CustomText>
      </div>
    </section>
  );
}

/** Reusable cost block for review request modal and carry request cards. */
export function CarryRequestCostSummary({
  weightKg,
  pricePerKg,
  priceCountry,
  showServiceFee = true,
  totalLabel,
  size = "default",
  variant = "default",
  className,
}: CarryRequestCostSummaryProps) {
  const { deliveryTotal, serviceFee, totalWithFee } = calculateCarryRequestPricing(
    pricePerKg,
    weightKg,
  );
  const resolvedTotalLabel =
    totalLabel ?? (showServiceFee ? "Total to pay" : "Total");
  const displayTotal = showServiceFee ? totalWithFee : deliveryTotal;
  const isEmbedded = variant === "embedded";
  const isReceipt = variant === "receipt";
  const labelSize = isEmbedded || isReceipt ? "xs" : size === "compact" ? "xs" : "sm";
  const valueSize = isEmbedded || isReceipt ? "xs" : "sm";
  const totalSize = isReceipt ? "sm" : isEmbedded ? "sm" : "md";

  const lineItems = (
    <>
      <CustomText textVariant="secondary" textSize={labelSize}>
        Parcel weight
      </CustomText>
      <CustomText textVariant="primary" textSize={valueSize} className="text-right">
        {weightKg} kg
      </CustomText>

      <CustomText textVariant="secondary" textSize={labelSize}>
        Price per kg
      </CustomText>
      <CustomText
        textVariant="primary"
        textSize={valueSize}
        className="text-right tabular-nums"
      >
        {formatCurrencyByCountry(priceCountry, pricePerKg)}
      </CustomText>

      {showServiceFee ? (
        <>
          <CustomText
            textVariant="secondary"
            textSize={labelSize}
            className="pt-2.5"
          >
            Subtotal
          </CustomText>
          <CustomText
            textVariant="primary"
            textSize={valueSize}
            className="pt-2.5 text-right tabular-nums"
          >
            {formatCurrencyByCountry(priceCountry, deliveryTotal)}
          </CustomText>
          <ServiceFeeRow
            priceCountry={priceCountry}
            serviceFee={serviceFee}
            compact={isEmbedded || isReceipt || size === "compact"}
          />
        </>
      ) : null}
    </>
  );

  const totalRow = (
    <>
      <CustomText
        textVariant="primary"
        textSize={isReceipt ? "sm" : totalSize}
        className={cn("font-semibold", !isReceipt && isEmbedded && "pt-0.5")}
      >
        {resolvedTotalLabel}
      </CustomText>
      <CustomText
        textVariant="primary"
        textSize={totalSize}
        className={cn(
          "text-right font-semibold tabular-nums",
          isReceipt && "text-lg font-bold text-success-600",
          !isReceipt && isEmbedded && "pt-0.5",
        )}
      >
        {formatCurrencyByCountry(priceCountry, displayTotal)}
      </CustomText>
    </>
  );

  const rows = (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] overflow-visible",
        isEmbedded || isReceipt ? "gap-y-0.5" : "gap-y-1",
      )}
    >
      {lineItems}
      {!isReceipt ? totalRow : null}
    </div>
  );

  if (isReceipt) {
    return (
      <section
        className={cn(
          "min-w-0 overflow-visible rounded-xl border border-slate-100/90 bg-white p-2.5 transition-colors duration-200 group-hover/card:border-primary-100/70",
          className,
        )}
      >
        {rows}
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center border-t border-slate-100 pt-2">
          {totalRow}
        </div>
      </section>
    );
  }

  if (isEmbedded) {
    return (
      <section
        className={cn(
          "min-w-0 overflow-visible border-t border-slate-200/70 pt-2",
          className,
        )}
      >
        {rows}
      </section>
    );
  }

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

      {rows}
    </section>
  );
}

/** @deprecated Use CarryRequestCostSummary — kept for existing imports. */
export function RequestCostSummarySection(
  props: CarryRequestCostSummaryProps,
) {
  return <CarryRequestCostSummary {...props} />;
}
