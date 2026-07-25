import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "../icons/MetaIcon";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import ComboBox from "./ComboBox";
import { cn } from "../lib/cn";
import { useLocations } from "../hookes/useLocation";
import {
  citySchema,
  countrySchema,
} from "@/app/shared/validation/formValidation";
import { toflag } from "@/app/Mapper";

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
  /** When set, country is fixed (ordinary users scoped to profile country). */
  lockedCountry?: string;
};

export default function Search({
  setSearchCity,
  setSearchCountry,
  clearResults,
  setClearResults,
  lockedCountry,
}: SearchProps) {
  const { control, watch, handleSubmit, reset, setValue } =
    useForm<SearchFields>({
    resolver: zodResolver(searchScema),
    defaultValues: {
      country: lockedCountry ?? "",
      city: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    });

  // Prefill + sync parent when profile country becomes available.
  useEffect(() => {
    if (!lockedCountry) return;
    setValue("country", lockedCountry, {
      shouldDirty: false,
      shouldValidate: true,
    });
    setSearchCountry(lockedCountry);
  }, [lockedCountry, setValue, setSearchCountry]);

  useEffect(() => {
    if (clearResults) {
      reset({
        country: lockedCountry ?? "",
        city: "",
      });
      setSearchCity("");
      setSearchCountry(lockedCountry ?? "");
      setClearResults();
    }
  }, [
    clearResults,
    lockedCountry,
    reset,
    setSearchCity,
    setSearchCountry,
    setClearResults,
  ]);

  const countryValue = watch("country");
  const cityValue = watch("city");

  const { countryOptions, cityOptions } = useLocations(
    lockedCountry || countryValue,
  );
  // Keep locked country visible even before location options finish loading.
  const visibleCountryOptions = lockedCountry
    ? Array.from(
        new Set([
          lockedCountry,
          ...countryOptions.filter((option) => option === lockedCountry),
        ]),
      )
    : countryOptions;

  const handleSearch = () => {
    const country = lockedCountry || countryValue;
    if (!country || !cityValue) return;
    setSearchCity(cityValue);
    setSearchCountry(country);
  };

  return (
    <form
      onSubmit={handleSubmit(handleSearch)}
      className={cn(
        "flex w-full sm:max-w-2xl lg:max-w-3xl flex-col gap-3 rounded-3xl sm:bg-primary-50 sm:border border-primary-100 pt-10 pb-3 px-3 sm:p-1 sm:px-1.5 lg:flex-row lg:items-center lg:justify-center lg:gap-3",
      )}
    >
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:flex-1 lg:flex-nowrap">
        <div className="w-full sm:min-w-[180px] sm:flex-1">
          {lockedCountry ? (
            <div className="flex w-full items-center gap-2 whitespace-nowrap rounded-xl border bg-white px-3 py-1.5 shadow-sm">
              {toflag(lockedCountry) ? (
                <SvgIcon size="xs" Icon={toflag(lockedCountry)!} />
              ) : null}
              <CustomText as="span" textSize="xs" className="text-neutral-700">
                {lockedCountry}
              </CustomText>
            </div>
          ) : (
            <Controller
              name="country"
              control={control}
              render={({ field, fieldState }) => (
                <ComboBox
                  heightClass="py-1.5"
                  className="w-full rounded-xl"
                  placeholder="Select country"
                  menuItems={visibleCountryOptions}
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
                />
              )}
            />
          )}
        </div>

        <div className="w-full sm:min-w-[180px] sm:flex-1">
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => (
              <ComboBox
                heightClass="py-1.5"
                className="w-full rounded-xl"
                placeholder="Select city"
                menuItems={cityOptions}
                disabled={!lockedCountry && !countryValue}
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

      <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:w-auto">
        <CustomText
          as="span"
          textSize="xs"
          className="text-center text-neutral-500 sm:text-left whitespace-nowrap"
        >
          Destination
        </CustomText>

        <div className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border bg-white px-3 py-1.5 shadow-sm sm:min-w-[150px]">
          <SvgIcon size="xs" Icon={META_ICONS.zimFlag} />
          <CustomText as="span" textSize="xs" className="text-neutral-700">
            Zimbabwe
          </CustomText>
        </div>

        <Button
          type="submit"
          cornerRadiusClass="rounded-full"
          variant="primary"
          size="xs"
          className="flex w-full items-center justify-center gap-2 sm:max-w-[200px]"
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

type SearchResultsProps = {
  isSearchActive: boolean;
  searchResults: number;
  onClick: () => void;
};

export function SearchResults({
  isSearchActive,
  searchResults,
  onClick,
}: SearchResultsProps) {
  return (
    <AnimatePresence>
      {isSearchActive && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex items-center gap-10"
        >
          <span className="inline-flex gap-2 items-center">
            <CustomText
              as="p"
              textSize="sm"
              textVariant="primary"
              className="font-medium"
            >
              ({searchResults})
            </CustomText>
            <CustomText as="p" textSize="xs" textVariant="secondary">
              {searchResults === 1 ? "result" : "results"} found
            </CustomText>
          </span>

          <button
            onClick={onClick}
            type="button"
            className="text-sm font-medium text-primary-500 hover:underline"
          >
            Clear search
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
