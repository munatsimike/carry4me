import CustomText from "@/components/ui/CustomText";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import { cn } from "@/app/lib/cn";
import {
  getTripBookedWeightKg,
  getTripCapacityRemainingPercent,
  getTripCapacityUrgency,
  getTripRemainingLabel,
  tripCapacityUrgencyStyles,
  tripCapacityUnusedStyles,
} from "@/app/features/trips/domain/tripCapacityUsage";

type WeightAndPriceProps = {
  weightLabel?: string;
  priceLabel?: string;
  weight: number;
  price: number;
  country?: string | null;
  capacityKg?: number;
};

export function WeightAndPrice({
  weightLabel = "Luggage space",
  weight,
  priceLabel = "Price per kg",
  price,
  country,
  capacityKg,
}: WeightAndPriceProps) {
  const labelColor = "neutral";
  const baseLabel = "flex justify-end";
  const textSize = "sm";
  const isTripCapacityMode = capacityKg != null && capacityKg > 0;
  const bookedKg = getTripBookedWeightKg(capacityKg, weight);
  const remainingPercent = getTripCapacityRemainingPercent(capacityKg, weight);
  const urgency = getTripCapacityUrgency(weight);
  const showUnusedDot = bookedKg === 0;
  const barStyles =
    bookedKg > 0
      ? tripCapacityUrgencyStyles[urgency]
      : tripCapacityUnusedStyles;
  const weightDisplay = isTripCapacityMode
    ? getTripRemainingLabel(weight)
    : `${weight}kg`;
  const bookedTooltipClass =
    "pointer-events-none absolute left-1/2 bottom-full z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-md opacity-0 translate-y-1 scale-95 transition-all duration-200 ease-out group-hover/capacity:translate-y-0 group-hover/capacity:scale-100 group-hover/capacity:opacity-100";

  return (
    <div className={`flex flex-col gap-2`}>
      {isTripCapacityMode ? (
        <div className="group/capacity relative flex items-center gap-2">
          <CustomText
            className={`${baseLabel} shrink-0 whitespace-nowrap`}
            as="div"
            textSize={textSize}
            textVariant={labelColor}
          >
            {weightLabel}
          </CustomText>

          <div
            className="w-[90px] shrink-0 rounded-full"
            aria-label={`${weight} kg remaining, ${bookedKg} kg booked`}
            role="progressbar"
            aria-valuenow={weight}
            aria-valuemin={0}
            aria-valuemax={capacityKg}
          >
            <div
              className={cn(
                "relative h-2 overflow-visible rounded-full",
                barStyles.track,
              )}
            >
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-300"
                style={{ width: `${remainingPercent}%` }}
              >
                <div
                  className={cn(
                    "h-full min-w-[0.5rem] rounded-full",
                    barStyles.fill,
                  )}
                />
                {showUnusedDot ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 size-2 -translate-y-1/2 rounded-full ring-2 ring-white",
                      tripCapacityUnusedStyles.dot,
                    )}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <span className="flex-1" aria-hidden />

          <CustomText
            as="div"
            textVariant={labelColor}
            className={`${baseLabel} shrink-0 whitespace-nowrap`}
            textSize={textSize}
          >
            {weightDisplay}
          </CustomText>

          <span className={bookedTooltipClass} role="tooltip">
            {bookedKg} kg booked
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <CustomText
            className={`${baseLabel} shrink-0 whitespace-nowrap`}
            as="div"
            textSize={textSize}
            textVariant={labelColor}
          >
            {weightLabel}
          </CustomText>
          <span className="flex-1" aria-hidden />
          <CustomText
            as="div"
            textVariant={labelColor}
            className={`${baseLabel} shrink-0 whitespace-nowrap`}
            textSize={textSize}
          >
            {weightDisplay}
          </CustomText>
        </div>
      )}

      <div className="flex justify-between items-center">
        <CustomText
          as="div"
          textVariant="primary"
          className="font-medium"
          textSize="md"
        >
          {priceLabel}
        </CustomText>
        <CustomText
          className="leading-none font-medium"
          as="div"
          textVariant="primary"
          textSize="md"
        >
          {formatCurrencyByCountry(country, price, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </CustomText>
      </div>
    </div>
  );
}
