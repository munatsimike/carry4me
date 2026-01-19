import CustomText from "@/components/ui/CustomText";
import { countryToCurrency } from "../../Mapper";
import type { Location } from "@/types/Ui";
import Stack from "../Stack";
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
  const baseLabel = "flex justify-end";
  const labelColor = "neutral";
  const textSize = "xsm";
  return (
    <div className="flex justify-end items-start gap-2">
      <div className="flex flex-col gap-3">
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
          {priceLabel}
        </CustomText>
      </div>

      <Stack>
        <CustomText as="div" textVariant="primary">
          {`${weight}${" kg"}`}
        </CustomText>
        <CustomText className="leading-none" as="div" textVariant="primary">
          {`${countryToCurrency[location]}${price}`}
        </CustomText>
      </Stack>
    </div>
  );
}
