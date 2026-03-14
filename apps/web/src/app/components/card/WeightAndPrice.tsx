import CustomText from "@/components/ui/CustomText";
import { countryToCurrency } from "../../Mapper";
import type { Location } from "@/types/Ui";

type WeightAndPriceProps = {
  weightLabel?: string;
  priceLabel?: string;
  weight: number;
  price: number;
  location: Location;
};

export function WeightAndPrice({
  weightLabel = "Available space",
  weight,
  priceLabel = "Price per kg",
  price,
  location,
}: WeightAndPriceProps) {
  const currency = countryToCurrency[location];
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
          {currency}
          {price}
        </CustomText>
      </div>
    </div>
  );
}
