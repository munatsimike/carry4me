import { Button } from "@/components/ui/Button";
import DropDownMenu from "./DropDownMenu";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "../icons/MetaIcon";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

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
  const heightClass = "py-0";
  const {
    register,
    watch,
    handleSubmit,
    resetField,
    reset,
    formState: { dirtyFields, errors, touchedFields },
  } = useForm<SearchFields>({
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
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-2 shadow-sm md:flex-nowrap"
    >
      <span className="flex flex-wrap gap-4">
        <div className="min-w-[150px] flex-1">
          <DropDownMenu
            register={register("country", {
              onChange: (e) => {
                if (e.target.value && !!dirtyFields.city && cityValue !== "") {
                  resetField("city");
                }
              },
            })}
            className="w-full rounded-xl bg-white shadow-sm"
            value={countryValue}
            placeholder={"Select country"}
            menuItems={countries}
            error={errors.country?.message}
            isTouched={!!touchedFields.country}
            isDirty={!!dirtyFields.country}
            heightClass={heightClass}
            textSize="text-md"
          />
        </div>

        <div className="min-w-[170px] flex-1">
          <DropDownMenu
            register={register("city")}
            className="w-full rounded-xl bg-white shadow-sm"
            value={cityValue}
            placeholder={"Select city"}
            menuItems={cities}
            heightClass={heightClass}
            error={errors.city?.message}
            isTouched={!!touchedFields.city}
            isDirty={!!dirtyFields.city}
            textSize="text-md"
          />
        </div>
      </span>

      <CustomText
        as="span"
        textSize="xsm"
        className="text-neutral-500 whitespace-nowrap"
      >
        to
      </CustomText>

      <div className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-white px-3 py-2 shadow-sm border">
        <SvgIcon size="md" Icon={META_ICONS.zimFlag} />
        <CustomText as="span" textSize="xsm" className="text-neutral-700">
          Zimbabwe
        </CustomText>
      </div>

      <Button
        type="submit"
        cornerRadiusClass="rounded-xl"
        variant="primary"
        size="sm"
        className="flex items-center gap-2 md:w-auto"
        leadingIcon={
          <SvgIcon color="onDark" size="sm" Icon={META_ICONS.searchIcon} />
        }
      >
        <CustomText textSize="sm" textVariant="onDark">
          Search
        </CustomText>
      </Button>
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
            <CustomText as="p" textSize="xsm" textVariant="secondary">
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
