import {
  NumberInputField,
  type NumberInputFieldProps,
} from "@/app/components/NumberInputField";
import type { FieldValues } from "react-hook-form";


type WeightFieldProps<T extends FieldValues> = NumberInputFieldProps<T>;

export function WeightField<T extends FieldValues>(props: WeightFieldProps<T>) {
  return <NumberInputField {...props} label={props.label ?? "Available weight (kg)"} />;
}