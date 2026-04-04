import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "../icons/MetaIcon";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect} from "react";
import ComboBox from "./ComboBox";
import { cn } from "../lib/cn";

const searchScema = z.object({
  country: z.string().min(1, "Select country"),
  city: z.string().min(1, "Select city"),
});

type SearchFields = z.infer<typeof searchScema>;

type SearchProps = {
  countries: string[];
  cities: string[];
  setSearchCountry: (s: string) => void;
  setSearchCity: (s: string) => void;
  setClearResults: () => void;
  clearResults: boolean;
};

export default function Search({
  countries,
  cities,
  setSearchCity,
  setSearchCountry,
  clearResults,
  setClearResults,
}: SearchProps) {
  const { control, watch, handleSubmit, reset } = useForm<SearchFields>({
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
  }, [clearResults]);

  const countryValue = watch("country");
  const cityValue = watch("city");
  
  const handleSearch = () => {
    if (!countryValue || !cityValue) return;
    setSearchCity(cityValue);
    setSearchCountry(countryValue);
  };

  return (
    <form
      onSubmit={handleSubmit(handleSearch)}
      className={cn("flex w-full sm:max-w-2xl lg:max-w-3xl flex-col gap-3 rounded-3xl sm:bg-primary-50 sm:border border-primary-100 pt-10 pb-3 px-3 sm:p-2 lg:flex-row lg:items-center lg:justify-center lg:gap-3",
      )}
    >
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:flex-1 lg:flex-nowrap">
        <div className="w-full sm:min-w-[180px] sm:flex-1">
          <Controller
            name="country"
            control={control}
            render={({ field, fieldState }) => (
              <ComboBox
                className="w-full rounded-xl"
                placeholder="Select Country"
                menuItems={countries}
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

        <div className="w-full sm:min-w-[180px] sm:flex-1">
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => (
              <ComboBox
                className="w-full rounded-xl"
                placeholder="Select city"
                menuItems={cities}
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

        <div className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border bg-white px-3 py-2 shadow-sm sm:min-w-[150px]">
          <SvgIcon size="xs" Icon={META_ICONS.zimFlag} />
          <CustomText as="span" textSize="xs" className="text-neutral-700">
            Zimbabwe
          </CustomText>
        </div>

        <Button
          type="submit"
          cornerRadiusClass="rounded-full"
          variant="primary"
          size="sm"
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
              {searchResults === 1 ? "parcel" : "parcels"} found
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
