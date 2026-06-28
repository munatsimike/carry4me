import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import type { GoodsItem } from "@/types/Ui";
import { GOODS_CONDITION_OPTIONS } from "@/app/shared/goodsCondition";
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import { cn, inputError, inputNeutral, inputStructural } from "@/app/lib/cn";

const EMPTY_ITEM: GoodsItem = {
  quantity: 1,
  description: "",
  size: "",
  condition: "new",
};

type GoodsManifestFieldsProps = {
  control: Control<ParcelFormFields>;
  register: UseFormRegister<ParcelFormFields>;
  errors: FieldErrors<ParcelFormFields>;
};

export default function GoodsManifestFields({
  control,
  register,
  errors,
}: GoodsManifestFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "itemDescriptions",
  });

  const canRemove = fields.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <CustomText textSize="sm" textVariant="label">
          What are you sending?
        </CustomText>
        <CustomText textSize="xs" textVariant="secondary">
          List each item with quantity, size, and condition. Use{" "}
          <span className="font-medium">Not applicable</span> for documents and
          other items where new or used does not apply. The traveler will sign
          this list at handover.
        </CustomText>
      </div>

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const itemErrors = errors.itemDescriptions?.[index];

          return (
            <div
              key={field.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-3 sm:p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <CustomText textSize="sm" className="font-medium text-ink-primary">
                  Item {index + 1}
                </CustomText>
                {canRemove ? (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-ink-primary"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`item-qty-${index}`}
                    className="text-xs font-medium text-neutral-600"
                  >
                    Quantity
                  </label>
                  <input
                    id={`item-qty-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    className={cn(
                      inputStructural,
                      itemErrors?.quantity ? inputError : inputNeutral,
                    )}
                    {...register(`itemDescriptions.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                  {itemErrors?.quantity?.message ? (
                    <FieldError message={itemErrors.quantity.message} />
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`item-size-${index}`}
                    className="text-xs font-medium text-neutral-600"
                  >
                    Size
                  </label>
                  <input
                    id={`item-size-${index}`}
                    type="text"
                    placeholder="e.g. M, shoe box, A4 envelope"
                    className={cn(
                      inputStructural,
                      itemErrors?.size ? inputError : inputNeutral,
                    )}
                    {...register(`itemDescriptions.${index}.size`, {
                      setValueAs: (value) =>
                        typeof value === "string" ? value.trimStart() : value,
                    })}
                  />
                  {itemErrors?.size?.message ? (
                    <FieldError message={itemErrors.size.message} />
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label
                    htmlFor={`item-desc-${index}`}
                    className="text-xs font-medium text-neutral-600"
                  >
                    Description
                  </label>
                  <input
                    id={`item-desc-${index}`}
                    type="text"
                    placeholder="e.g. Nike trainers, iPhone charger"
                    maxLength={160}
                    className={cn(
                      inputStructural,
                      itemErrors?.description ? inputError : inputNeutral,
                    )}
                    {...register(`itemDescriptions.${index}.description`, {
                      setValueAs: (value) =>
                        typeof value === "string" ? value.trimStart() : value,
                    })}
                  />
                  {itemErrors?.description?.message ? (
                    <FieldError message={itemErrors.description.message} />
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs font-medium text-neutral-600">
                    Condition
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {GOODS_CONDITION_OPTIONS.map(({ value, label }) => (
                      <label
                        key={value}
                        className="inline-flex cursor-pointer items-center"
                      >
                        <input
                          type="radio"
                          value={value}
                          className="peer sr-only"
                          {...register(`itemDescriptions.${index}.condition`)}
                        />
                        <span
                          className={cn(
                            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                            "border-neutral-200 bg-white text-neutral-600",
                            "peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700",
                          )}
                        >
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {itemErrors?.condition?.message ? (
                    <FieldError message={itemErrors.condition.message} />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {errors.itemDescriptions?.message ? (
        <FieldError message={errors.itemDescriptions.message} />
      ) : null}

      <Button
        type="button"
        variant="neutral"
        size="md"
        className="w-full sm:w-auto"
        onClick={() => append({ ...EMPTY_ITEM })}
      >
        <span className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add another item
        </span>
      </Button>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <CustomText textSize="xs" className="text-ink-error">
      {message}
    </CustomText>
  );
}
