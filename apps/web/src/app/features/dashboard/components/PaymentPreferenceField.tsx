import { cn } from "@/app/lib/cn";
import ErrorText from "@/app/components/text/ErrorText";
import CustomText from "@/components/ui/CustomText";
import type { PaymentPreference } from "@/app/shared/listings/paymentPreference";

type PaymentPreferenceOption = {
  id: PaymentPreference;
  label: string;
};

type PaymentPreferenceFieldProps = {
  heading: string;
  description?: string;
  name: string;
  value: string | undefined;
  options: readonly PaymentPreferenceOption[];
  error?: string;
  onChange: (value: PaymentPreference) => void;
};

export function PaymentPreferenceField({
  heading,
  description,
  name,
  value,
  options,
  error,
  onChange,
}: PaymentPreferenceFieldProps) {
  return (
    <ErrorText error={error}>
      <fieldset className="flex min-w-0 flex-col gap-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <CustomText
            as="p"
            textSize="sm"
            textVariant="primary"
            className="font-medium"
          >
            {heading}
          </CustomText>
          {description ? (
            <CustomText as="p" textSize="xs" textVariant="secondary">
              {description}
            </CustomText>
          ) : null}
        </div>
        <div
          className="flex min-w-0 flex-col gap-2"
          role="radiogroup"
          aria-label={heading}
        >
          {options.map((option) => {
            const selected = value === option.id;
            const inputId = `${name}-${option.id}`;
            return (
              <label
                key={option.id}
                htmlFor={inputId}
                className={cn(
                  "flex min-w-0 cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5 transition sm:gap-3",
                  selected
                    ? "border-primary-500 bg-primary-50"
                    : "border-neutral-200 bg-white hover:border-primary-200",
                )}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={name}
                  value={option.id}
                  checked={selected}
                  onChange={() => onChange(option.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600"
                />
                <CustomText
                  as="span"
                  textSize="sm"
                  textVariant="formText"
                  className="min-w-0 flex-1"
                >
                  {option.label}
                </CustomText>
              </label>
            );
          })}
        </div>
      </fieldset>
    </ErrorText>
  );
}
