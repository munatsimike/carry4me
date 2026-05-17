import ComboBox from "@/app/components/ComboBox";
import { useLocations } from "@/app/hookes/useLocation";
import { META_ICONS } from "@/app/icons/MetaIcon";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
} from "react-hook-form";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();
  const originCountry = watch("originCountry" as Path<T>);
  const { countryOptions, cityOptions } = useLocations(originCountry);
  const searchParams = new URLSearchParams(location.search);
  const destinationCountry = searchParams.get("destinationCountry") ?? "";
  const destinationCity = searchParams.get("destinationCity") ?? "";
  const destinationLabel =
    destinationCountry || destinationCity
      ? `${destinationCountry}${destinationCountry && destinationCity ? " / " : ""}${destinationCity}`
      : "Zimbabwe";

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
                    setValue("originCity" as Path<T>, "" as any, {
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
                  menuItems={cityOptions}
                  disabled={!originCountry}
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
      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center sm:gap-4">
        <CustomText className="text-left sm:text-right" textSize="sm" textVariant="label">
          {"Destination"}
        </CustomText>

        <CustomText
          as="span"
          textSize="sm"
          textVariant="primary"
          className="inline-flex min-w-0 max-w-full items-center justify-start gap-3 rounded-xl border border-slate-300 bg-neutral-100 px-3 py-2"
        >
          <SvgIcon size={"xs"} Icon={META_ICONS.zimFlag} />
          {destinationLabel}
        </CustomText>
      </div>
    </div>
  );
}
