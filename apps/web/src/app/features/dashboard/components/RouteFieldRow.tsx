import ComboBox from "@/app/components/ComboBox";
import CustomText from "@/components/ui/CustomText";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

type RouteRowProps<T extends FieldValues> = {
  control: Control<T>;
};

export default function RouteFieldRow<T extends FieldValues>({
  control,
}: RouteRowProps<T>) {
  return (
    <div className="flex flex-col gap-5 ">
      <div className="flex">
        <span className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-2 sm:gap-4 ">
          <CustomText className="text-left sm:text-right" textSize="sm" textVariant="label">
            {"Origin"}
          </CustomText>
          <span className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Controller
              name={"originCountry" as Path<T>}
              control={control}
              render={({ field, fieldState }) => (
                <ComboBox
                 className="rounded-lg"
                  placeholder="Select Country"
                  menuItems={["UK", "USA", "Ireland"]}
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
                  menuItems={["London", "Birmingham", "Manchester"]}
                  value={field.value}
                  onValueChange={field.onChange}
                  isDirty={fieldState.isDirty}
                  isTouched={fieldState.isTouched}
                  error={fieldState.error?.message}
                  searchable
                />
              )}
            />
          </span>
        </span>
      </div>
      <span className="grid grid-cols-[96px_1fr] items-center gap-3">
        <CustomText className="text-right" textSize="sm" textVariant="label">
          {"Destination"}
        </CustomText>

        <span className="pl-1">
          <CustomText
            as="span"
            textSize="sm"
            textVariant="primary"
            className="inline-flex rounded-lg bg-neutral-50 border border-slate-300 w-fit px-3 h-10 justify-center items-center "
          >
            {"Zimbabwe"}
          </CustomText>
        </span>
      </span>
    </div>
  );
}
