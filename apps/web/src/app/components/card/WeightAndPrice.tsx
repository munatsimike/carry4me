import CustomText from "@/components/ui/CustomText";
import { formatCurrencyByCountry } from "@/app/lib/currency";

type WeightAndPriceProps = {
  weightLabel?: string;
  priceLabel?: string;
  weight: number;
  price: number;
  country?: string | null;
};

export function WeightAndPrice({
  weightLabel = "Available space",
  weight,
  priceLabel = "Price per kg",
  price,
  country,
}: WeightAndPriceProps) {
  const labelColor = "neutral";
  const baseLabel = "flex justify-end";
  const textSize = "sm";
  return (
    <div className={`flex flex-col gap-2`}>
      <div className="flex justify-between items-center">
        <CustomText
          className={baseLabel}
          as="div"
          textSize={textSize}
          textVariant={labelColor}
        >
          {weightLabel}
        </CustomText>
        <CustomText
          as="div"
          textVariant={labelColor}
          className={baseLabel}
          textSize={textSize}
        >
          {weight}kg
        </CustomText>
      </div>

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
