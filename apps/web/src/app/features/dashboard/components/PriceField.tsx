import { getCurrencySymbolByCountry } from "@/app/lib/currency";
import {
  NumberInputField,
  type NumberInputFieldProps,
} from "@/app/components/NumberInputField";
import type { FieldValues } from "react-hook-form";

type PriceFieldProps<T extends FieldValues> = NumberInputFieldProps<T> & {
  /** Origin (or listing) country used to pick the currency symbol. */
  country?: string | null;
  /** Tooltip shown beside the label (hover or tap the info icon). */
  hint?: string;
};

export function PriceField<T extends FieldValues>({
  country,
  prefix,
  hint,
  ...props
}: PriceFieldProps<T>) {
  return (
    <NumberInputField
      {...props}
      label={props.label ?? "Price per kg"}
      labelHint={hint}
      prefix={prefix ?? getCurrencySymbolByCountry(country)}
    />
  );
}
