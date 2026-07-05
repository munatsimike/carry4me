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
  DESTINATION_CITY_OPTIONS,
  FIXED_DESTINATION_CITY,
  FIXED_DESTINATION_COUNTRY,
} from "@/app/shared/locations/fixedDestination";
import SvgIcon from "@/components/ui/SvgIcon";
import CustomText from "@/components/ui/CustomText";
import { toflag } from "@/app/Mapper";
import { useEffect, useState } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
} from "react-hook-form";
import type { SvgIconComponent } from "@/types/Ui";

type RouteRowProps<T extends FieldValues> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
  watch: (field: Path<T>) => string;
  lockOriginCountry?: boolean;
  lockedOriginCountry?: string;
};

function ReadonlyRouteField({
  label,
  leadingIcon,
}: {
  label: string;
  leadingIcon?: SvgIconComponent;
}) {
  return (
    <div
      className="flex h-10 w-full min-w-0 cursor-not-allowed items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3"
      aria-readonly="true"
    >
      {leadingIcon && <SvgIcon size="xs" Icon={leadingIcon} />}
      <CustomText as="span" textSize="sm" className="truncate text-neutral-500">
        {label}
      </CustomText>
    </div>
  );
}

function LockedCountryField({
  countryCode,
  countryLabel,
  disabledMessage,
  error,
}: {
  countryCode: string;
  countryLabel: string;
  disabledMessage: string;
  error?: string;
}) {
  const [showMessage, setShowMessage] = useState(false);
  const flagIcon = countryCode ? toflag(countryCode) : null;

  useEffect(() => {
    if (!showMessage) return;

    const timer = window.setTimeout(() => {
      setShowMessage(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [showMessage]);

  return (
    <div className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setShowMessage(true)}
        className="flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-left"
        aria-label={disabledMessage}
      >
        {flagIcon && <SvgIcon size="xs" Icon={flagIcon} />}
        <CustomText as="span" textSize="sm" className="text-neutral-500">
          {countryLabel}
        </CustomText>
      </button>
      {showMessage && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          {disabledMessage}
        </div>
      )}
      {error && (
        <CustomText as="p" textSize="xs" className="mt-1 text-ink-error">
          {error}
        </CustomText>
      )}
    </div>
  );
}

export default function RouteFieldRow<T extends FieldValues>({
  control,
  setValue,
  watch,
  lockOriginCountry = false,
  lockedOriginCountry = "",
}: RouteRowProps<T>) {
  const originCountry = watch("originCountry" as Path<T>);
  const originCity = watch("originCity" as Path<T>);
  const destinationCity = watch("destinationCity" as Path<T>);
  const { countryOptions, cityOptions: originCityOptions, getCountryName } =
    useLocations(originCountry);
  const originCityMenuItems = withOtherCityOption(originCityOptions);
  const showOriginCustomCityInput = isOtherCitySelection(originCity);

  useEffect(() => {
    setValue(
      "destinationCountry" as Path<T>,
      FIXED_DESTINATION_COUNTRY as never,
      { shouldValidate: true, shouldDirty: false },
    );
  }, [setValue]);

  useEffect(() => {
    if (destinationCity?.trim()) return;

    setValue("destinationCity" as Path<T>, FIXED_DESTINATION_CITY as never, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [destinationCity, setValue]);

  useEffect(() => {
    if (!lockOriginCountry || !lockedOriginCountry) return;
    if (originCountry === lockedOriginCountry) return;

    setValue("originCountry" as Path<T>, lockedOriginCountry as never, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [lockOriginCountry, lockedOriginCountry, originCountry, setValue]);

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
              render={({ field, fieldState }) =>
                lockOriginCountry ? (
                  <LockedCountryField
                    countryCode={field.value || lockedOriginCountry}
                    countryLabel={getCountryName(
                      field.value || lockedOriginCountry,
                    )}
                    disabledMessage="Locked to your verified number"
                    error={fieldState.error?.message}
                  />
                ) : (
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
                )
              }
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
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          <ReadonlyRouteField
            label={FIXED_DESTINATION_COUNTRY}
            leadingIcon={META_ICONS.zimFlag}
          />
          <Controller
            name={"destinationCity" as Path<T>}
            control={control}
            render={({ field, fieldState }) => (
              <ComboBox
                className="rounded-lg"
                placeholder="Select city"
                menuItems={[...DESTINATION_CITY_OPTIONS]}
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
