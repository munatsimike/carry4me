import ComboBox from "@/app/components/ComboBox";
import FloatingInputField from "@/app/components/CustomInputField";
import { useLocations } from "@/app/hookes/useLocation";
import { META_ICONS } from "@/app/icons/MetaIcon";
import {
  isOtherCitySelection,
  OTHER_CITY_OPTION,
  withOtherCityOption,
} from "@/app/shared/locations/cityOptions";
import {
  FIXED_DESTINATION_CITY,
  FIXED_DESTINATION_COUNTRY,
} from "@/app/shared/locations/fixedDestination";
import SvgIcon from "@/components/ui/SvgIcon";
import CustomText from "@/components/ui/CustomText";
import { useEffect } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
} from "react-hook-form";

type RouteRowProps<T extends FieldValues> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  watch: (field: Path<T>) => string;
};

export default function RouteFieldRow<T extends FieldValues>({
  control,
  setValue,
  watch,
}: RouteRowProps<T>) {
  const originCountry = watch("originCountry" as Path<T>);
  const originCity = watch("originCity" as Path<T>);
  const { countryOptions, cityOptions: originCityOptions } =
    useLocations(originCountry);
  const originCityMenuItems = withOtherCityOption(originCityOptions);
  const showOriginCustomCityInput = isOtherCitySelection(originCity);

  useEffect(() => {
    setValue(
      "destinationCountry" as Path<T>,
      FIXED_DESTINATION_COUNTRY as never,
      { shouldValidate: true, shouldDirty: false },
    );
    setValue("destinationCity" as Path<T>, FIXED_DESTINATION_CITY as never, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [setValue]);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div>
        <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center sm:gap-4">
          <CustomText
            className="text-left sm:text-right"
            textSize="sm"
            textVariant="label"
          >
            {"Origin"}
          </CustomText>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <Controller
              name={"originCountry" as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <ComboBox
                  className="rounded-lg"
                  placeholder="Select country"
                  menuItems={countryOptions}
                  value={field.value}
                  onValueChange={(nextCountry) => {
                    field.onChange(nextCountry);
                    setValue("originCity" as Path<T>, "" as never, {
                      shouldDirty: true,
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                    setValue("originCustomCity" as Path<T>, "" as never, {
                      shouldDirty: true,
                      shouldValidate: true,
                      shouldTouch: true,
                    });
                  }}
                  isDirty={fieldState.isDirty}
                  isTouched={fieldState.isTouched}
                  error={fieldState.error?.message}
                  searchable
                />
              )}
            />

            <Controller
              name={"originCity" as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <ComboBox
                  className="rounded-lg"
                  placeholder="Select city"
                  menuItems={originCityMenuItems}
                  disabled={!originCountry}
                  disabledMessage="Select a country first"
                  value={field.value}
                  onValueChange={(nextCity) => {
                    field.onChange(nextCity);
                    if (nextCity !== OTHER_CITY_OPTION) {
                      setValue("originCustomCity" as Path<T>, "" as never, {
                        shouldDirty: true,
                        shouldValidate: true,
                        shouldTouch: true,
                      });
                    }
                  }}
                  isDirty={fieldState.isDirty}
                  isTouched={fieldState.isTouched}
                  error={fieldState.error?.message}
                  searchable
                />
              )}
            />

            {showOriginCustomCityInput && (
              <div className="sm:col-span-2">
                <Controller
                  name={"originCustomCity" as Path<T>}
                  control={control}
                  render={({ field, fieldState }) => (
                    <FloatingInputField
                      label="Enter city"
                      placeholder="Type your city"
                      className="max-w-none w-full"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      isDirty={fieldState.isDirty}
                      isTouched={fieldState.isTouched}
                      hasValue={Boolean(field.value?.trim())}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center sm:gap-4">
        <CustomText
          className="text-left sm:text-right"
          textSize="sm"
          textVariant="label"
        >
          {"Destination"}
        </CustomText>
        <div
          className="flex h-10 w-full max-w-xs cursor-not-allowed items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3"
          aria-readonly="true"
        >
          <SvgIcon size="xs" Icon={META_ICONS.zimFlag} />
          <CustomText as="span" textSize="sm" className="text-neutral-500">
            {FIXED_DESTINATION_COUNTRY}
          </CustomText>
        </div>
      </div>
    </div>
  );
}
