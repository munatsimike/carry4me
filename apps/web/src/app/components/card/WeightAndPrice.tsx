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

export default function WeighAndPrice({
  weightLabel = "Available space :",
  priceLabel = "Price per kg :",
  weight,
  price,
  location,
}: WeightAndPriceProps) {
  return (
    <div className="flex justify-end items-start gap-2">
      <div className="flex flex-col gap-3">
        <CustomText className="flex justify-end" as="div" textSize="xsm">
          {weightLabel}
        </CustomText>
        <CustomText as="div" className="flex justify-end" textSize="xsm">
          {priceLabel}
        </CustomText>
      </div>

      <span className="flex flex-col gap-3">
        <CustomText as="div" textVariant="primary">
          {`${weight}${" Kg"}`}
        </CustomText>
        <CustomText className="leading-none" as="div" textVariant="primary">
          {`${countryToCurrency[location]}${price}`}
        </CustomText>
      </span>
    </div>
  );
}
