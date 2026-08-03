import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "../icons/MetaIcon";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import ComboBox from "./ComboBox";
import { cn } from "../lib/cn";
import { useLocations } from "../hookes/useLocation";
import {
  citySchema,
  countrySchema,
} from "@/app/shared/validation/formValidation";

const searchScema = z.object({
  country: countrySchema,
  city: citySchema,
});

type SearchFields = z.infer<typeof searchScema>;

type SearchProps = {
  setSearchCountry: (s: string) => void;
  setSearchCity: (s: string) => void;
  setClearResults: () => void;
  clearResults: boolean;
  /** Show Clear next to Search when an active search returned matches. */
  showClear?: boolean;
  onClearSearch?: () => void;
};

export default function Search({
  setSearchCity,
  setSearchCountry,
  clearResults,
  setClearResults,
  showClear = false,
  onClearSearch,
}: SearchProps) {
  const { control, watch, handleSubmit, reset, setValue } =
    useForm<SearchFields>({
    resolver: zodResolver(searchScema),
    defaultValues: {
      country: "",
      city: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    });

  useEffect(() => {
    if (clearResults) {
      reset();
      setSearchCity("");
      setSearchCountry("");
      setClearResults();
    }
  }, [clearResults, reset, setSearchCity, setSearchCountry, setClearResults]);

  const countryValue = watch("country");
  const cityValue = watch("city");

  const { countryOptions, cityOptions } = useLocations(countryValue);

  const handleSearch = () => {
    if (!countryValue || !cityValue) return;
    setSearchCity(cityValue);
    setSearchCountry(countryValue);
  };

  return (
    <form
      onSubmit={handleSubmit(handleSearch)}
      className={cn(
        "flex w-full flex-col gap-3 rounded-3xl border-primary-100 pt-10 pb-3 px-3 sm:border sm:bg-primary-50 sm:p-2 sm:px-2.5 lg:flex-row lg:items-center lg:gap-2.5",
        showClear ? "sm:max-w-3xl lg:max-w-4xl" : "sm:max-w-2xl lg:max-w-3xl",
      )}
    >
      <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:flex-1 lg:flex-nowrap">
        <div className="w-full min-w-0 sm:min-w-[140px] sm:flex-1">
          <Controller
            name="country"
            control={control}
            render={({ field, fieldState }) => (
              <ComboBox
                heightClass="py-1.5"
                className="w-full rounded-xl"
                placeholder="Select country"
                menuItems={countryOptions}
                value={field.value}
                onValueChange={(nextCountry) => {
                  field.onChange(nextCountry);
                  setValue("city", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                    shouldTouch: true,
                  });
                }}
                isDirty={fieldState.isDirty}
                isTouched={fieldState.isTouched}
                error={fieldState.error?.message}
                searchable
                borderless
              />
            )}
          />
        </div>

        <div className="w-full min-w-0 sm:min-w-[140px] sm:flex-1">
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => (
              <ComboBox
                heightClass="py-1.5"
                className="w-full rounded-xl"
                placeholder="Select city"
                menuItems={cityOptions}
                disabled={!countryValue}
                disabledMessage="Select a country first"
                value={field.value}
                onValueChange={field.onChange}
                isDirty={fieldState.isDirty}
                isTouched={fieldState.isTouched}
                error={fieldState.error?.message}
                searchable
                borderless
              />
            )}
          />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center lg:w-auto">
        <CustomText
          as="span"
          textSize="xs"
          className="whitespace-nowrap text-center text-neutral-500 sm:text-left"
        >
          Destination
        </CustomText>

        <div className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 shadow-sm sm:min-w-[130px]">
          <SvgIcon size="xs" Icon={META_ICONS.zimFlag} />
          <CustomText as="span" textSize="xs" className="text-neutral-700">
            Zimbabwe
          </CustomText>
        </div>

        {showClear && onClearSearch ? (
          <Button
            type="button"
            cornerRadiusClass="rounded-full"
            variant="ghost"
            size="xs"
            onClick={onClearSearch}
            className="inline-flex shrink-0 items-center justify-center border border-primary-200 bg-white px-3 text-primary-600 hover:bg-primary-50"
          >
            <CustomText textSize="sm" className="text-primary-600">
              Clear
            </CustomText>
          </Button>
        ) : null}

        <Button
          type="submit"
          cornerRadiusClass="rounded-full"
          variant="primary"
          size="xs"
          className="inline-flex shrink-0 items-center justify-center gap-2 px-3"
          leadingIcon={
            <SvgIcon color="onDark" size="sm" Icon={META_ICONS.searchIcon} />
          }
        >
          <CustomText textSize="sm" textVariant="onDark">
            Search
          </CustomText>
        </Button>
      </div>
    </form>
  );
}
