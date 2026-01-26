import CustomText from "@/components/ui/CustomText";
import { countryToCurrency } from "../../Mapper";
import type { Location } from "@/types/Ui";
import Stack from "../Stack";

type LableValueStackProps = {
  firstLabel: string;
  firstValue: string;
  secondLabel: string;
  secondValue: string;
  className?: string;
};

type WeightAndPriceProps = {
  weightLabel?: string;
  priceLabel?: string;
  weight: number;
  price: number;
  location: Location;
};

type PriceProps = {
  unitPriceLabel: string;
  unitPrice: number;
  totalPriceLabel?: string;
  totalPrice: number;
  location: Location;
  className?: string;
};

export function Price({
  unitPriceLabel,
  unitPrice,
  totalPriceLabel = "Total price : ",
  totalPrice,
  location,
  className,
}: PriceProps) {
  const currency = countryToCurrency[location];
  return (
    <LableValueStack
      className={className}
      firstLabel={`${unitPriceLabel}${" : "}`}
      secondLabel={totalPriceLabel}
      firstValue={`${currency}${unitPrice.toString()}`}
      secondValue={`${currency}${totalPrice.toString()}`}
    />
  );
}

export function WeightAndPrice({
  weightLabel = "Available space :",
  weight,
  priceLabel = "Price per kg :",
  price,
  location,
}: WeightAndPriceProps) {
  const currency = countryToCurrency[location];
  return (
    <LableValueStack
      firstLabel={weightLabel}
      secondLabel={priceLabel}
      firstValue={`${weight.toString()} ${"kg"}`}
      secondValue={`${currency}${price.toString()}`}
    />
  );
}

function LableValueStack({
  firstLabel,
  secondLabel,
  firstValue,
  secondValue,
  className,
}: LableValueStackProps) {
  const labelColor = "neutral";
  const baseLabel = "flex justify-end";
  const textSize = "xsm";
  return (
    <div className={`flex items-start gap-2 justify-end ${className}`}>
      <div className="flex flex-col gap-2">
        <CustomText
          className={baseLabel}
          as="div"
          textSize={textSize}
          textVariant={labelColor}
        >
          {firstLabel}
        </CustomText>
        <CustomText
          as="div"
          textVariant={labelColor}
          className={baseLabel}
          textSize={textSize}
        >
          {secondLabel}
        </CustomText>
      </div>

      <Stack>
        <CustomText as="div" textVariant="primary">
          {firstValue}
        </CustomText>
        <CustomText className="leading-none" as="div" textVariant="primary">
          {secondValue}
        </CustomText>
      </Stack>
    </div>
  );
}
