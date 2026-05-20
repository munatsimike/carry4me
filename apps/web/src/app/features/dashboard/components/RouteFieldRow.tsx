import ComboBox from "@/app/components/ComboBox";
import FloatingInputField from "@/app/components/CustomInputField";
import { useLocations } from "@/app/hookes/useLocation";
import {
  isOtherCitySelection,
  OTHER_CITY_OPTION,
  withOtherCityOption,
} from "@/app/shared/locations/cityOptions";
import CustomText from "@/components/ui/CustomText";
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
  const destinationCountry = watch("destinationCountry" as Path<T>);
  const { countryOptions, cityOptions: originCityOptions } =
    useLocations(originCountry);
  const { cityOptions: destinationCityOptions } = useLocations(destinationCountry);
  const originCityMenuItems = withOtherCityOption(originCityOptions);
  const showOriginCustomCityInput = isOtherCitySelection(originCity);

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
        <CustomText className="text-left sm:text-right" textSize="sm" textVariant="label">
          {"Destination"}
        </CustomText>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <Controller
            name={"destinationCountry" as Path<T>}
            control={control}
            render={({ field, fieldState }) => (
              <ComboBox
                className="rounded-lg"
                placeholder="Select country"
                menuItems={countryOptions}
                value={field.value}
                onValueChange={(nextCountry) => {
                  field.onChange(nextCountry);
                  setValue("destinationCity" as Path<T>, "" as never, {
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
            name={"destinationCity" as Path<T>}
            control={control}
            render={({ field, fieldState }) => (
              <ComboBox
                className="rounded-lg"
                placeholder="Select city"
                menuItems={destinationCityOptions}
                disabled={!destinationCountry}
                disabledMessage="Select a country first"
                value={field.value}
                onValueChange={field.onChange}
                isDirty={fieldState.isDirty}
                isTouched={fieldState.isTouched}
                error={fieldState.error?.message}
                searchable
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
