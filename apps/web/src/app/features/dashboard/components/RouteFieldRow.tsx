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
} from "react-hook-form";
import { useLocation } from "react-router-dom";

type RouteRowProps<T extends FieldValues> = {
  control: Control<T>;
  watch: (field: Path<T>) => string;
};

export default function RouteFieldRow<T extends FieldValues>({
  control,
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
    <div className="flex flex-col gap-5 ">
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-2 sm:gap-4 ">
          <CustomText
            className="text-left sm:text-right"
            textSize="sm"
            textVariant="label"
          >
            {"Origin"}
          </CustomText>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ">
            <Controller
              name={"originCountry" as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <ComboBox
                  className="rounded-lg"
                  placeholder="Select Country"
                  menuItems={countryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
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
                  placeholder="Select City"
                  menuItems={cityOptions}
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
      <div className="grid grid-cols-[96px_1fr] items-center gap-4">
        <CustomText className="text-right" textSize="sm" textVariant="label">
          {"Destination"}
        </CustomText>

        <CustomText
          as="span"
          textSize="sm"
          textVariant="primary"
          className="inline-flex rounded-xl bg-neutral-100 border border-slate-300 px-3 h-9 justify-center items-center max-w-[200px] gap-2"
        >
          <SvgIcon size={"xs"} Icon={META_ICONS.zimFlag} />
          {destinationLabel}
        </CustomText>
      </div>
    </div>
  );
}
