import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import { isAllGoodsCategory } from "@/app/features/goods/domain/goodsCategoryConstants";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useGoodsCategories } from "@/app/hooks/queries/useGoodsQueries";
import { useQueryErrorEffect } from "@/app/hooks/useQueryErrorEffect";
import type { CustomRange, SortOption } from "@/types/Ui";

export type FiltersFormValues = {
  date: string;
  minPrice: string;
  maxPrice: string;
  minSpace: string;
  maxSpace: string;
  categories: string[];
  countries: string[];
  sort: SortOption | undefined;
};

type FilterState = {
  date: string;
  minPrice: string;
  maxPrice: string;
  minSpace: string;
  maxSpace: string;
  categories: string[];
  countries: string[];
  sort?: SortOption;
};

type UseFiltersFormProps = {
  setSelectedDate: (s: string) => void;
  setPriceRange: (v: CustomRange) => void;
  setWeightRange: (v: CustomRange) => void;
  setGoodsCategory: (s: string[]) => void;
  setOriginCountries: (s: string[]) => void;
  setSortOption: (v: SortOption | undefined) => void;
  /** Profile country codes checked by default (e.g. ["NL"]). */
  defaultCountries?: string[];
};

export function useFiltersForm({
  setSelectedDate,
  setPriceRange,
  setWeightRange,
  setGoodsCategory,
  setOriginCountries,
  setSortOption,
  defaultCountries = [],
}: UseFiltersFormProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const { data, error } = useGoodsCategories();
  useQueryErrorEffect(error);

  const goodsCategory: GoodsCategory[] = useMemo(
    () => (data ?? []).filter((category) => !isAllGoodsCategory(category)),
    [data],
  );

  const filterDefaults = useMemo<FilterState>(
    () => ({
      date: "",
      minPrice: "0",
      maxPrice: "",
      minSpace: "1",
      maxSpace: "",
      categories: [],
      countries: defaultCountries,
      sort: undefined,
    }),
    [defaultCountries],
  );

  const form = useForm<FiltersFormValues>({
    defaultValues: filterDefaults,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { dirtyFields },
  } = form;

  // Apply profile country once it loads.
  useEffect(() => {
    if (defaultsApplied) return;
    if (defaultCountries.length === 0) return;

    setValue("countries", defaultCountries, {
      shouldDirty: false,
      shouldTouch: false,
    });
    setOriginCountries(defaultCountries);
    setDefaultsApplied(true);
  }, [defaultCountries, defaultsApplied, setOriginCountries, setValue]);

  const values = watch();

  const hasDate = !!values.date;
  const hasPrice = !!values.maxPrice;
  const hasSpace = !!values.maxSpace;
  const hasCategory = values.categories.length > 0;
  const defaultCountryKey = defaultCountries.slice().sort().join("|");
  const selectedCountryKey = (values.countries ?? []).slice().sort().join("|");
  const hasCountry = (values.countries?.length ?? 0) > 0;
  const hasCountryFilter = selectedCountryKey !== defaultCountryKey;
  const hasSort = !!values.sort;

  const hasFilter =
    hasDate ||
    hasPrice ||
    hasSpace ||
    hasCategory ||
    hasCountryFilter ||
    hasSort;

  const toggleMenu = (menuName: string) => {
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  const closeMenu = () => setOpenMenu(null);

  const submitFilters = handleSubmit((formValues) => {
    if (dirtyFields.date) {
      setSelectedDate(formValues.date);
    }

    if (dirtyFields.maxPrice) {
      setPriceRange({
        min: Number(formValues.minPrice),
        max: Number(formValues.maxPrice),
      });
    }

    if (dirtyFields.maxSpace) {
      setWeightRange({
        min: Number(formValues.minSpace),
        max: Number(formValues.maxSpace),
      });
    }

    if (dirtyFields.categories) {
      setGoodsCategory(formValues.categories);
    }

    // Always apply — country defaults are set without dirtying the field.
    setOriginCountries(formValues.countries ?? []);

    if (dirtyFields.sort) {
      setSortOption(formValues.sort);
    }

    closeMenu();
  });

  const clearFilters = () => {
    setSelectedDate("");
    setPriceRange({ min: 0, max: 0 });
    setWeightRange({ min: 0, max: 0 });
    setGoodsCategory([]);
    setOriginCountries(defaultCountries);
    setSortOption(undefined);
    reset({
      ...filterDefaults,
      countries: defaultCountries,
    });
  };

  const resetCountriesToDefault = () => {
    setValue("countries", defaultCountries, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setOriginCountries(defaultCountries);
    closeMenu();
  };

  const handleClearAndClose = () => {
    clearFilters();
    closeMenu();
  };

  return {
    register,
    control,
    setValue,
    openMenu,
    toggleMenu,
    closeMenu,
    submitFilters,
    clearFilters,
    handleClearAndClose,
    resetCountriesToDefault,
    defaultCountries,
    goodsCategory,
    hasDate,
    hasPrice,
    hasSpace,
    hasCategory,
    hasCountry,
    hasSort,
    hasFilter,
  };
}
