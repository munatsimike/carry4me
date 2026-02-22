import {
  NumberInputField,
  type NumberInputFieldProps,
} from "@/app/components/NumberInputField";
import type { FieldValues } from "react-hook-form";

type PriceFieldProps<T extends FieldValues> = NumberInputFieldProps<T>;

export function PriceField<T extends FieldValues>(props: PriceFieldProps<T>) {
  return (
    <NumberInputField {...props} label={props.label ?? "Price per (kg)"} />
  );
}
